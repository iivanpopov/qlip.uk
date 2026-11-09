import { API_URL } from '#/config'

export const ConnectionStatus = {
  Initializing: 'initializing',
  Waiting: 'waiting',
  Connecting: 'connecting',
  Connected: 'connected',
  Disconnected: 'disconnected',
  Failed: 'failed',
  Closed: 'closed',
} as const
export type ConnectionStatus = (typeof ConnectionStatus)[keyof typeof ConnectionStatus]

export type RTCMessage = string | Blob | ArrayBuffer | ArrayBufferView<ArrayBuffer>

type ConnectionOptions = {
  room: string
  clientId: string
  onMessage: (message: MessageEvent) => Promise<void> | void
}

export class Connection {
  status = $state<ConnectionStatus>(ConnectionStatus.Initializing)

  private ws: WebSocket | null = null
  private peer: Promise<RTCPeerConnection> | null = null
  private channel: RTCDataChannel | null = null
  private outgoingMessage: RTCMessage | null = null
  private iceServers: RTCIceServer[] | null = null
  private abort = new AbortController()

  constructor(private readonly options: ConnectionOptions) {}

  private async closeRTC() {
    const peer = await this.peer?.catch(() => null)

    this.peer = null
    this.channel = null

    peer?.close()
  }

  private closeWS() {
    const ws = this.ws

    this.ws = null

    if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'close' }))

    return new Promise<void>((resolve) => {
      if (!ws || ws.readyState === WebSocket.CLOSED) return resolve()

      const onChange = () => resolve()

      ws.addEventListener('close', onChange, { once: true })

      setTimeout(() => {
        ws.removeEventListener('close', onChange)
        resolve()
      }, 3_000)

      if (ws?.readyState === WebSocket.OPEN) ws?.close(1000)
    })
  }

  async close(status: ConnectionStatus = ConnectionStatus.Closed) {
    this.abort.abort()

    this.outgoingMessage = null
    this.status = status

    await Promise.all([this.closeRTC(), this.closeWS()])
  }

  private async fetchIce(token: string) {
    const signal = this.abort.signal

    const iceServers = await fetch(`${API_URL}/ice?token=${token}`, { signal })
      .then((response) => {
        if (response.ok) return response.json()
        return []
      })
      .catch(() => [])

    this.iceServers = iceServers

    return iceServers as RTCIceServer[]
  }

  private async createRTC(token: string) {
    const signal = this.abort.signal
    let iceServers = this.iceServers
    if (!iceServers) iceServers = await this.fetchIce(token)

    const peer = new RTCPeerConnection({ iceServers })
    const channel = peer.createDataChannel('data', { negotiated: true, id: 0 })
    channel.binaryType = 'blob'

    this.channel = channel

    peer.onicecandidate = ({ candidate }) => {
      if (!candidate) return

      const send = () => this.ws!.send(JSON.stringify({ type: 'candidate', candidate }))

      if (this.ws?.readyState === WebSocket.CONNECTING)
        this.ws.addEventListener('open', send, { once: true })
      else if (this.ws?.readyState === WebSocket.OPEN) send()
    }

    peer.onconnectionstatechange = () => {
      if (signal.aborted || this.channel !== channel) return

      if (peer.connectionState === 'disconnected') this.status = ConnectionStatus.Disconnected
      else if (peer.connectionState === 'failed') this.status = ConnectionStatus.Failed
      else if (peer.connectionState === 'connected' && channel.readyState === 'open')
        this.status = ConnectionStatus.Connected
    }

    channel.onopen = () => {
      if (signal.aborted || this.channel !== channel) return
      this.status = ConnectionStatus.Connected

      channel.onmessage = this.options.onMessage

      if (!this.outgoingMessage) return
      this.send(this.outgoingMessage)
      this.outgoingMessage = null
    }

    channel.onclose = () => {
      if (signal.aborted || this.channel !== channel) return
      if (this.status !== ConnectionStatus.Failed) this.status = ConnectionStatus.Disconnected

      return this.closeRTC()
    }

    channel.onerror = (event) => {
      if (signal.aborted || this.channel !== channel) return

      const { error } = event as RTCErrorEvent
      const remoteClosed = error.errorDetail === 'sctp-failure' && error.sctpCauseCode === 12

      this.status = remoteClosed ? ConnectionStatus.Disconnected : ConnectionStatus.Failed
    }

    return peer
  }

  private getRTC(token: string) {
    return (this.peer ??= this.createRTC(token))
  }

  async connect(token: string) {
    this.status = ConnectionStatus.Initializing

    this.abort = new AbortController()
    const signal = this.abort.signal
    void this.getRTC(token).catch(() => {
      if (!signal.aborted) this.status = ConnectionStatus.Failed
    })

    const { room, clientId } = this.options
    try {
      this.ws = new WebSocket(`${API_URL}/${room}?clientId=${clientId}`)
    } catch (error) {
      this.status = ConnectionStatus.Failed
      console.error(error)
      return
    }

    this.ws.onopen = () => {
      if (!signal.aborted && this.status === ConnectionStatus.Initializing)
        this.status = ConnectionStatus.Waiting
    }

    const candidates = new Set<RTCIceCandidateInit>()

    const onMessage = async (message: MessageEvent) => {
      if (signal.aborted || !this.ws || typeof message.data !== 'string') return

      const parsed = JSON.parse(message.data)

      if (parsed.type === 'ready') {
        this.status = ConnectionStatus.Connecting
        let peer = await this.getRTC(token)
        if (peer.connectionState !== 'new') {
          await this.closeRTC()
          peer = await this.getRTC(token)
        }

        await peer!.setLocalDescription()

        this.ws.send(JSON.stringify({ type: 'offer', offer: peer!.localDescription }))
      } else if (parsed.type === 'offer') {
        this.status = ConnectionStatus.Connecting
        let peer = await this.getRTC(token)
        if (peer.connectionState !== 'new') {
          await this.closeRTC()
          peer = await this.getRTC(token)
        }

        await peer!.setRemoteDescription(parsed.offer)
        await peer!.setLocalDescription()

        for (const candidate of candidates) await peer!.addIceCandidate(candidate)
        candidates.clear()

        this.ws.send(JSON.stringify({ type: 'answer', answer: peer!.localDescription }))
      } else if (parsed.type === 'candidate') {
        const peer = await this.peer

        if (peer!.remoteDescription) await peer!.addIceCandidate(parsed.candidate)
        else candidates.add(parsed.candidate)
      } else if (parsed.type === 'answer') {
        const peer = await this.peer

        await peer!.setRemoteDescription(parsed.answer)

        for (const candidate of candidates) await peer!.addIceCandidate(candidate)
        candidates.clear()
      } else if (parsed.type === 'close') {
        await this.closeRTC()
        if (!signal.aborted) this.status = ConnectionStatus.Disconnected
      }
    }

    let pending = Promise.resolve()
    this.ws.onmessage = (message) => {
      pending = pending
        .then(() => onMessage(message))
        .catch((error) => {
          if (!signal.aborted) this.status = ConnectionStatus.Failed
          console.error(error)
        })
    }

    this.ws.onerror = () => {
      if (!signal.aborted) this.status = ConnectionStatus.Failed
    }

    this.ws.onclose = () => {
      if (signal.aborted) return
      if (
        this.status === ConnectionStatus.Connected ||
        this.status === ConnectionStatus.Disconnected
      )
        return this.close(ConnectionStatus.Disconnected)
      return this.close(ConnectionStatus.Failed)
    }
  }

  send(message: RTCMessage) {
    const channel = this.channel
    const signal = this.abort.signal

    const send = () => {
      if (channel?.readyState !== 'open') return
      channel.send(message as any)
    }

    if (channel?.readyState === 'connecting')
      channel.addEventListener('open', send, { once: true, signal })
    else if (channel?.readyState === 'open') send()
    else if (channel === null && this.status === ConnectionStatus.Connecting)
      this.outgoingMessage = message
  }
}

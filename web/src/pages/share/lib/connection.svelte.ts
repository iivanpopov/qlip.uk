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

type ConnectionOptions = {
  room: string
  clientId: string
  onMessage: (message: string | ArrayBuffer) => void
  onOpen: () => void
  onClose: () => void
}

export class Connection {
  status = $state<ConnectionStatus>(ConnectionStatus.Initializing)

  private ws: WebSocket | null = null
  private peer: Promise<RTCPeerConnection> | null = null
  private channel: RTCDataChannel | null = null
  private candidates = new Set<RTCIceCandidateInit>()
  private iceServers: RTCIceServer[] | null = null
  private abort = new AbortController()

  constructor(private readonly options: ConnectionOptions) {}

  get isOpen() {
    return this.channel?.readyState === 'open'
  }

  private async closeRTC() {
    const peer = await this.peer?.catch(() => null)

    this.peer = null
    this.channel = null
    this.candidates.clear()
    this.options.onClose()

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
    const channel = peer.createDataChannel('data', { negotiated: true, id: 0, ordered: true })
    channel.binaryType = 'arraybuffer'

    this.channel = channel
    channel.onmessage = (event: MessageEvent<string | ArrayBuffer>) => {
      if (signal.aborted || this.channel !== channel) return
      this.options.onMessage(event.data)
    }

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

      this.options.onOpen()
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

        await peer.setLocalDescription()

        this.ws.send(JSON.stringify({ type: 'offer', offer: peer.localDescription }))
      } else if (parsed.type === 'offer') {
        this.status = ConnectionStatus.Connecting
        let peer = await this.getRTC(token)
        if (peer.connectionState !== 'new') {
          await this.closeRTC()
          peer = await this.getRTC(token)
        }

        await peer.setRemoteDescription(parsed.offer)
        await peer.setLocalDescription()

        for (const candidate of this.candidates) await peer.addIceCandidate(candidate)
        this.candidates.clear()

        this.ws.send(JSON.stringify({ type: 'answer', answer: peer.localDescription }))
      } else if (parsed.type === 'candidate') {
        const peer = await this.peer

        if (peer!.remoteDescription) await peer!.addIceCandidate(parsed.candidate)
        else this.candidates.add(parsed.candidate)
      } else if (parsed.type === 'answer') {
        const peer = await this.peer

        await peer!.setRemoteDescription(parsed.answer)

        for (const candidate of this.candidates) await peer!.addIceCandidate(candidate)
        this.candidates.clear()
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

  send(message: string | ArrayBuffer) {
    const channel = this.channel
    if (!channel || channel.readyState !== 'open') throw new Error('Data channel is not open')

    if (typeof message === 'string') channel.send(message)
    else channel.send(message)
  }
}

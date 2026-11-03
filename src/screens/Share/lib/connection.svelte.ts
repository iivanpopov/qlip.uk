import { API_URL } from '#/config'

import { closeChannel, closeWebSocket } from '../utils'

export const ConnectionStatus = {
  Connected: 'connected',
  Connecting: 'connecting',
  Closed: 'closed',
  Closing: 'closing',
  Disconnected: 'disconnected',
  RateLimited: 'rate-limited',
} as const
export type ConnectionStatus = (typeof ConnectionStatus)[keyof typeof ConnectionStatus]

export type RTCMessage = string | Blob | ArrayBuffer | ArrayBufferView<ArrayBuffer>

type Subscriber = (message: MessageEvent) => Promise<void> | void

export class Connection {
  status = $state<ConnectionStatus>(ConnectionStatus.Disconnected)

  ws: WebSocket | null = null
  peer: RTCPeerConnection | null = null
  channel: RTCDataChannel | null = null

  private subscribers = new Set<Subscriber>()
  private outgoingMessage: RTCMessage | null = null
  private abort = new AbortController()
  private closing: Promise<void> | null = null

  constructor(
    readonly room: string,
    readonly clientId: string,
  ) {}

  close = () => {
    if (this.closing) return this.closing

    this.status = ConnectionStatus.Closing
    this.abort.abort()

    this.subscribers.clear()
    this.outgoingMessage = null

    const ws = this.ws
    const peer = this.peer
    const channel = this.channel
    this.ws = null
    this.peer = null
    this.channel = null

    if (ws) {
      ws.onmessage = null
      ws.onclose = null
      if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'close' }))
    }

    if (peer) peer.onicecandidate = null
    if (channel) {
      channel.onopen = null
      channel.onmessage = null
    }

    this.closing = Promise.all([closeWebSocket(ws), closeChannel(channel)]).then(() => {
      this.status = ConnectionStatus.Closed
      this.closing = null
    })
    peer?.close()

    return this.closing
  }

  private initRtc = async (ws: WebSocket, signal: AbortSignal) => {
    const iceServers = await fetch(`${API_URL.replace(/\/$/, '')}/ice`, { signal })
      .then(async (response): Promise<RTCIceServer[]> => {
        if (response.ok) return response.json()
        if (response.status === 429 && !signal.aborted) this.status = ConnectionStatus.RateLimited
        return []
      })
      .catch(() => [])

    if (signal.aborted) return

    const peer = new RTCPeerConnection({ iceServers })
    const channel = peer.createDataChannel('data', { negotiated: true, id: 0 })
    this.peer = peer
    this.channel = channel

    peer.onicecandidate = ({ candidate }) => {
      if (!candidate || signal.aborted) return

      const send = () => {
        if (signal.aborted || ws.readyState !== WebSocket.OPEN) return
        ws.send(JSON.stringify({ type: 'candidate', candidate }))
      }

      if (ws.readyState === WebSocket.CONNECTING)
        ws.addEventListener('open', send, { once: true, signal })
      else send()
    }

    channel.onopen = () => {
      if (signal.aborted) return
      this.status = ConnectionStatus.Connected
      channel.onmessage = (message) => this.subscribers.forEach((callback) => callback(message))
      if (this.outgoingMessage !== null) {
        this.send(this.outgoingMessage)
        this.outgoingMessage = null
      }
    }

    return peer
  }

  connect = async () => {
    if (this.closing || this.ws || this.channel || this.peer)
      throw Error('Previous connection is not closed')

    this.status = ConnectionStatus.Connecting
    this.abort = new AbortController()
    const { signal } = this.abort

    const ws = new WebSocket(`${API_URL}/${this.room}?clientId=${this.clientId}`)
    this.ws = ws

    const candidates = new Set<RTCIceCandidateInit>()
    const active = () => !signal.aborted && ws.readyState === WebSocket.OPEN

    const onMessage = async (message: MessageEvent) => {
      if (!active() || typeof message.data !== 'string') return
      const parsed = JSON.parse(message.data)

      if (parsed.type === 'ready') {
        const peer = await this.initRtc(ws, signal)
        if (!peer || !active()) return
        await peer.setLocalDescription({ type: 'offer' })
        if (!active()) return

        ws.send(JSON.stringify({ type: 'offer', offer: peer.localDescription }))
      } else if (parsed.type === 'offer') {
        const peer = await this.initRtc(ws, signal)
        if (!peer || !active()) return
        await peer.setRemoteDescription(parsed.offer)
        if (!active()) return
        await peer.setLocalDescription({ type: 'answer' })
        if (!active()) return

        for (const candidate of candidates) {
          await peer.addIceCandidate(candidate)
          if (!active()) return
        }
        candidates.clear()

        ws.send(JSON.stringify({ type: 'answer', answer: peer.localDescription }))
      } else if (parsed.type === 'candidate') {
        const peer = this.peer
        if (peer?.remoteDescription) await peer.addIceCandidate(parsed.candidate)
        else candidates.add(parsed.candidate)
      } else if (parsed.type === 'answer') {
        const peer = this.peer
        if (!peer) return
        await peer.setRemoteDescription(parsed.answer)
        if (!active()) return
        for (const candidate of candidates) {
          await peer.addIceCandidate(candidate)
          if (!active()) return
        }
        candidates.clear()
      } else if (parsed.type === 'close') await this.close()
    }

    let pending = Promise.resolve()
    ws.onmessage = (message) => {
      pending = pending
        .then(() => onMessage(message))
        .catch(async (error) => {
          if (signal.aborted) return
          console.error('Signaling failed', error)
          await this.close()
        })
    }
    ws.onclose = () => void this.close()
  }

  reconnect = async () => {
    await this.close()
    await this.connect()
  }

  onMessage = (callback: Subscriber) => {
    this.subscribers.add(callback)
    return () => this.subscribers.delete(callback)
  }

  send = (message: RTCMessage) => {
    const channel = this.channel
    const { signal } = this.abort

    const send = () => {
      if (signal.aborted || channel?.readyState !== 'open') return
      channel.send(message as any)
    }

    if (channel?.readyState === 'connecting')
      channel.addEventListener('open', send, { once: true, signal })
    else if (channel?.readyState === 'open') send()
    else if (channel === null && this.status === ConnectionStatus.Connecting)
      this.outgoingMessage = message
  }
}

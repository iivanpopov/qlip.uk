import { API_URL } from '#/config'
import { api } from '#/lib'

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

export class Connection {
  status = $state<ConnectionStatus>(ConnectionStatus.Disconnected)

  ws: WebSocket | null = null
  peer: RTCPeerConnection | null = null
  channel: RTCDataChannel | null = null

  private abort = new AbortController()

  constructor(
    readonly room: string,
    readonly clientId: string,
  ) {}

  close = async (): Promise<void> => {
    if (this.status === ConnectionStatus.Closing) return

    this.ws?.send(JSON.stringify({ type: 'close' }))
    this.status = ConnectionStatus.Closing

    this.abort.abort()

    await closeChannel(this.channel)
    await closeWebSocket(this.ws)

    this.peer?.close()

    this.peer = null
    this.channel = null
    this.ws = null

    this.status = ConnectionStatus.Closed
  }

  connect = async (): Promise<void> => {
    if (this.ws || this.channel || this.peer) throw Error('Previous connection is not closed')

    const abort = new AbortController()
    this.abort = abort

    this.status = ConnectionStatus.Connecting

    const iceServers = await api<RTCIceServer[]>('/ice', {
      retryDelay: 60,
      signal: abort.signal,
      onResponseError: ({ response, error }) => {
        if (abort.signal.aborted) return

        console.log(error)
        if (response.status === 429) this.status = ConnectionStatus.RateLimited
      },
    }).catch(() => [])

    if (abort.signal.aborted) return

    this.peer = new RTCPeerConnection({ iceServers })

    this.channel = this.peer.createDataChannel('data', { negotiated: true, id: 0 })

    this.ws = new WebSocket(`${API_URL}/${this.room}?clientId=${this.clientId}`)

    const candidates = new Set<RTCIceCandidateInit>()

    this.ws.onmessage = async (message) => {
      if (typeof message.data !== 'string') return
      const parsed = JSON.parse(message.data)

      if (parsed.type === 'ready') {
        await this.peer!.setLocalDescription({ type: 'offer' })

        this.ws!.send(JSON.stringify({ type: 'offer', offer: this.peer!.localDescription }))
      } else if (parsed.type === 'offer') {
        await this.peer!.setRemoteDescription(parsed.offer)
        await this.peer!.setLocalDescription({ type: 'answer' })

        for (const candidate of candidates) await this.peer!.addIceCandidate(candidate)
        candidates.clear()

        this.ws!.send(JSON.stringify({ type: 'answer', answer: this.peer!.localDescription }))
      } else if (parsed.type === 'candidate') {
        if (this.peer!.remoteDescription) await this.peer!.addIceCandidate(parsed.candidate)
        else candidates.add(parsed.candidate)
      } else if (parsed.type === 'answer') {
        await this.peer!.setRemoteDescription(parsed.answer)

        for (const candidate of candidates) await this.peer!.addIceCandidate(candidate)
        candidates.clear()
      } else if (parsed.type === 'close') {
        await this.close()
      }
    }

    this.peer.onicecandidate = ({ candidate }) => {
      if (!candidate) return

      const send = () => this.ws!.send(JSON.stringify({ type: 'candidate', candidate }))

      if (this.ws!.readyState === WebSocket.CONNECTING)
        this.ws!.addEventListener('open', send, { once: true })
      else send()
    }

    this.channel.onopen = async () => {
      this.status = ConnectionStatus.Connected
    }
  }

  reconnect = async (): Promise<void> => {
    await this.close()
    await this.connect()
  }
}

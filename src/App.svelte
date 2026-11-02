<script lang="ts">
  import QrCode from '#/components/QrCode.svelte'
  import { LOCALSTORAGE_CLIENT_ID } from '#/constants'
  import { api } from '#/lib/ofetch'
  import { generateCode } from '#/utils/generateCode'

  let rateLimited = $state(false)
  let connected = $state(false)

  const clientId = localStorage.getItem(LOCALSTORAGE_CLIENT_ID)
  const room = window.location.pathname.split('/')[1] || generateCode()
  const qr = `${window.location.origin}/${room}`

  const iceServers = await api<RTCIceServer[]>('/ice', {
    retry: false,
    onResponseError: ({ response }) => {
      if (response.status === 429) rateLimited = true
    },
  }).catch(() => [])

  const peer = new RTCPeerConnection({ iceServers })
  const channel = peer.createDataChannel('data', { negotiated: true, id: 0 })
  const candidates = new Set<RTCIceCandidateInit>()

  const ws = new WebSocket(`${import.meta.env.VITE_API_URL}/${room}?clientId=${clientId}`)

  ws.onmessage = async (message) => {
    if (typeof message.data !== 'string') return
    const parsed = JSON.parse(message.data)

    if (parsed.type === 'ready') {
      await peer.setLocalDescription({ type: 'offer' })

      ws.send(JSON.stringify({ type: 'offer', offer: peer.localDescription }))
    } else if (parsed.type === 'offer') {
      await peer.setRemoteDescription(parsed.offer)
      await peer.setLocalDescription({ type: 'answer' })

      for (const candidate of candidates) await peer.addIceCandidate(candidate)
      candidates.clear()

      ws.send(JSON.stringify({ type: 'answer', answer: peer.localDescription }))
    } else if (parsed.type === 'candidate') {
      if (peer.remoteDescription) await peer.addIceCandidate(parsed.candidate)
      else candidates.add(parsed.candidate)
    } else if (parsed.type === 'answer') {
      await peer.setRemoteDescription(parsed.answer)

      for (const candidate of candidates) await peer.addIceCandidate(candidate)
      candidates.clear()
    }
  }

  peer.onicecandidate = ({ candidate }) => {
    if (candidate) ws.send(JSON.stringify({ type: 'candidate', candidate }))
  }

  channel.onopen = () => {
    connected = true
  }
</script>

<div class="layout">
  <header>
    {#if rateLimited}
      <div class="rate-limit">You are being rate limited</div>
    {/if}
    {#if connected}
      <div class="connected">Connected to {room}</div>
    {/if}
  </header>
  <main>
    <QrCode code={qr} size={350} />
  </main>
  <footer></footer>
</div>

<style>
  .layout {
    min-height: 100dvh;
  }

  header,
  footer {
    height: 10dvh;
  }

  main {
    margin: 0 auto;
    width: 400px;
    display: flex;
    justify-content: center;
  }

  .rate-limit,
  .connected {
    width: 100%;
    display: flex;
    justify-content: center;
    padding: 0.5rem 0;
  }

  .rate-limit {
    background: var(--warning);
    color: var(--warning-foreground);
  }

  .connected {
    background: var(--success);
    color: var(--success-foreground);
  }
</style>

<script lang="ts">
  import Layout from '#/components/Layout.svelte'
  import QrCode from '#/components/QrCode.svelte'
  import { generateCode } from '#/utils/generateCode'

  import { LOCALSTORAGE_CLIENT_ID } from './constants'

  const clientId = localStorage.getItem(LOCALSTORAGE_CLIENT_ID)
  const roomCode = window.location.pathname.split('/')[1] || generateCode()
  const qrUrl = `${window.location.origin}/${roomCode}`

  const ws = new WebSocket(`${import.meta.env.VITE_API_URL}/${roomCode}?clientId=${clientId}`)

  const peer = new RTCPeerConnection({
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
  })

  peer.onicegatheringstatechange = () => {
    if (peer.iceGatheringState !== 'complete') return
    peer.onicegatheringstatechange = null

    const description = peer.localDescription
    if (!description) return

    ws.send(JSON.stringify({ type: description.type, [description.type]: description }))
  }

  ws.onmessage = async (message) => {
    if (typeof message.data !== 'string') return
    const parsed = JSON.parse(message.data)

    if (parsed.type === 'ready') {
      peer.createDataChannel('data')
      await peer.setLocalDescription()
    } else if (parsed.type === 'offer') {
      await peer.setRemoteDescription(parsed.offer)
      await peer.setLocalDescription()
    } else if (parsed.type === 'answer') await peer.setRemoteDescription(parsed.answer)
  }

  ws.onerror = () => window.location.replace('/')
</script>

<Layout>
  <QrCode code={qrUrl} />
</Layout>

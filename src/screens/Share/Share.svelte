<script lang="ts">
  import { onMount } from 'svelte'

  import { LOCALSTORAGE_CLIENT_ID } from '#/constants'

  import QrCode from './components/QrCode.svelte'
  import Status from './components/Status.svelte'
  import Turnstile from './components/Turnstile.svelte'
  import { Connection } from './lib'
  import { generateCode } from './utils'

  let incoming = $state<string | Blob>()

  const clientId = localStorage.getItem(LOCALSTORAGE_CLIENT_ID)!
  const room = window.location.pathname.split('/')[1] || generateCode()

  const onMessage = (event: MessageEvent) => {
    incoming = event.data
  }

  const connection = new Connection({ room, clientId, onMessage })

  const onPaste = async () => {
    const [item] = await navigator.clipboard.read()
    if (!item) return
    const type = item.types[0]
    const blob = await item.getType(type)

    if (type.startsWith('text/')) connection.send(await blob.text())
    else connection.send(blob)
  }

  const onCopy = () => {
    if (typeof incoming === 'string') navigator.clipboard.writeText(incoming)
    else if (incoming instanceof Blob) {
      const blob = new Blob([incoming], { type: 'image/png' })
      navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
    }
  }

  const onSave = () => {
    const blob = new Blob([incoming!], { type: 'image/png' })

    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'image.png'
    a.click()
  }

  const onToken = (token?: string) => {
    if (!token) return
    connection.connect(token)
  }

  onMount(() => () => connection.close())

  const qr = `${window.location.origin}/${room}`
</script>

<svelte:head>
  <title>qlip</title>
</svelte:head>
<svelte:document onpaste={onPaste} />

<Status status={connection.status} />
<main>
  <QrCode code={qr} size={500} />
  <Turnstile {onToken} />
  <button onclick={onCopy} hidden={!incoming}>Copy</button>
  <button onclick={onSave} hidden={!(incoming instanceof Blob)}>Save</button>
</main>

<style>
  main {
    display: flex;
    flex-direction: column;
    width: min(80vw, 400px);
    margin: 0 auto;
    gap: 1.5rem;
  }

  button {
    background: var(--surface);
    height: 2.25rem;
  }
</style>

<script lang="ts">
  import { DeleteIcon } from '@lucide/svelte'
  import { onMount } from 'svelte'

  import { LOCALSTORAGE_CLIENT_ID } from '#/constants'

  import QrCode from './components/QrCode.svelte'
  import Status from './components/Status.svelte'
  import { Connection } from './lib'
  import { generateCode } from './utils'

  const clientId = localStorage.getItem(LOCALSTORAGE_CLIENT_ID)!
  const room = window.location.pathname.split('/')[1] || generateCode()
  const qr = `${window.location.origin}/${room}`

  const connection = new Connection(room, clientId)

  let incomingData = $state<string>()

  connection.onMessage((event) => {
    incomingData = event.data
  })

  const onPaste = async () => {
    const [item] = await navigator.clipboard.read()
    if (!item) return
    const type = item.types[0]
    const blob = await item.getType(type)

    if (type.startsWith('text/')) connection.send(await blob.text())
    else connection.send(blob)
  }

  const onCopy = () => {
    if (incomingData) void navigator.clipboard.writeText(incomingData)
    incomingData = ''
  }

  onMount(() => {
    void connection.connect()
    return () => connection.close()
  })
</script>

<svelte:document onpaste={onPaste} />

<Status status={connection.status} />
<main>
  <QrCode code={qr} size={500} />
  <button onclick={onCopy} hidden={!incomingData}>Copy</button>
</main>

<style>
  main {
    display: flex;
    flex-direction: column;
    height: 80dvh;
    align-items: center;
    width: min(80vw, 400px);
    margin: 0 auto;
    gap: 2rem;
  }

  button {
    width: 100%;
    border: none;
    font-weight: 500;
    background: var(--muted-foreground);
    height: 2.25rem;
  }
</style>

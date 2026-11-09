<script lang="ts">
  import { DownloadIcon } from '@lucide/svelte'
  import { onMount } from 'svelte'

  import { LOCALSTORAGE_CLIENT_ID } from '#/constants'

  import ConnectionStatus from './components/connection-status.svelte'
  import QrCode from './components/qr-code.svelte'
  import Turnstile from './components/turnstile.svelte'
  import { Session } from './lib'
  import { generateCode } from './utils'

  const clientId = localStorage.getItem(LOCALSTORAGE_CLIENT_ID)!
  const room = window.location.pathname.split('/')[1] || generateCode()

  const session = new Session({ room, clientId })

  const onPaste = (event: ClipboardEvent) => {
    const data = event.clipboardData
    if (!data) return

    void session
      .send({ files: Array.from(data.files), text: data.getData('text/plain') })
      .catch(console.error)
  }

  const canCopy = (file: File) =>
    file.type === 'text/plain' ||
    (typeof ClipboardItem !== 'undefined' && ClipboardItem.supports(file.type))

  const onCopy = async (file: File) => {
    if (file.type === 'text/plain') await navigator.clipboard.writeText(await file.text())
    else if (canCopy(file))
      await navigator.clipboard.write([new ClipboardItem({ [file.type]: file })])
  }

  const onSave = (file: File) => {
    const url = URL.createObjectURL(file)
    const a = document.createElement('a')
    a.href = url
    a.download = file.name
    a.click()
  }

  const onToken = (token: string) => session.connect(token)

  onMount(() => () => session.dispose())

  const qr = `${window.location.origin}/${room}`
</script>

<svelte:head>
  <title>qlip</title>
</svelte:head>
<svelte:document onpaste={onPaste} />

<ConnectionStatus status={session.status} />
<main>
  <QrCode code={qr} size={500} />
  <Turnstile {onToken} />
  {#each session.received as file (file)}
    <div class="item">
      <button onclick={() => onCopy(file)} disabled={!canCopy(file)}>
        {file.name}
      </button>
      <button data-icon onclick={() => onSave(file)} aria-label={`Download ${file.name}`}>
        <DownloadIcon />
      </button>
    </div>
  {/each}
</main>

<style>
  main {
    display: flex;
    flex-direction: column;
    width: min(80vw, 400px);
    margin: 0 auto;
    gap: 1rem;
  }

  .item {
    display: flex;
    gap: 0.5rem;
  }
</style>

<script lang="ts">
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

  onMount(connection.connect)
</script>

<Status status={connection.status} />
<main>
  <QrCode code={qr} size={500} />
</main>

<style>
  main {
    margin: 0 auto 0 auto;
    display: flex;
    height: 90dvh;
    justify-content: center;
  }
</style>

<script lang="ts">
  import { ConnectionStatus } from '../lib'

  let { status }: { status: ConnectionStatus } = $props()
</script>

{#if status === ConnectionStatus.Disconnected}
  <div class="info">Not connected</div>
{:else if status === ConnectionStatus.RateLimited}
  <div class="warning">Rate limited</div>
{:else if status === ConnectionStatus.Connected}
  <div class="success">Connected</div>
{:else if status === ConnectionStatus.Connecting}
  <div class="info">Connecting...</div>
{:else if status === ConnectionStatus.Closed}
  <div class="info">Closed</div>
{:else if status === ConnectionStatus.Closing}
  <div class="info">Closing...</div>
{/if}

<style>
  .info,
  .warning,
  .success {
    width: 100%;
    display: flex;
    justify-content: center;
    padding: 0.5rem 0;
    margin-bottom: 5dvh;
  }

  .info {
    background: var(--foreground);
    color: #1b2126;
  }

  .warning {
    background: var(--warning);
    color: var(--warning-foreground);
  }

  .success {
    background: var(--success);
    color: var(--success-foreground);
  }
</style>

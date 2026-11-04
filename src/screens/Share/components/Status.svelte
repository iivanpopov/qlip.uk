<script lang="ts">
  import { ConnectionStatus } from '../lib'

  let { status }: { status: ConnectionStatus } = $props()

  const labels: Record<ConnectionStatus, string> = {
    [ConnectionStatus.Disconnected]: 'Not connected',
    [ConnectionStatus.RateLimited]: 'Rate limited',
    [ConnectionStatus.Connected]: 'Connected',
    [ConnectionStatus.Connecting]: 'Connecting...',
    [ConnectionStatus.Closed]: 'Closed',
    [ConnectionStatus.Closing]: 'Closing...',
  }
</script>

<div data-status={status}>
  {labels[status]}
</div>

<style>
  div {
    min-height: 40px;
    line-height: 40px;
    text-align: center;
    margin-bottom: 5dvh;
    background: var(--surface);
    color: var(--muted-foreground);
  }

  [data-status='rate-limited'] {
    background: var(--warning);
    color: var(--warning-foreground);
  }

  [data-status='connected'] {
    background: var(--success);
    color: var(--success-foreground);
  }
</style>

<script lang="ts">
  import { ConnectionStatus } from '../lib'

  let { status }: { status: ConnectionStatus } = $props()

  const labels: Record<ConnectionStatus, string> = {
    [ConnectionStatus.Initializing]: 'Preparing connection…',
    [ConnectionStatus.Waiting]: 'Scan the QR code or open link on another device.',
    [ConnectionStatus.Connecting]: 'Connecting devices...',
    [ConnectionStatus.Connected]: 'Ready to send text and images.',
    [ConnectionStatus.Disconnected]:
      'Connection to the other device was lost. Waiting for it to reconnect…',
    [ConnectionStatus.Failed]: 'Could not connect. Check your network and reload the page.',
    [ConnectionStatus.Closed]: 'Connection ended.',
  }
</script>

<div data-status={status} role="status" aria-live="polite">
  {labels[status]}
</div>

<style>
  div {
    min-height: 40px;
    padding: 8px 16px;
    line-height: 24px;
    text-align: center;
    margin-bottom: 5dvh;
    background: var(--surface);
    color: var(--muted-foreground);
  }

  [data-status='failed'] {
    background: var(--error);
    color: var(--error-foreground);
  }

  [data-status='disconnected'] {
    background: var(--warning);
    color: var(--warning-foreground);
  }

  [data-status='connected'] {
    background: var(--success);
    color: var(--success-foreground);
  }
</style>

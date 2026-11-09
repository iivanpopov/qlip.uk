<script lang="ts">
  import Privacy from './pages/privacy/privacy.svelte'
  import Share from './pages/share/share.svelte'
  import Terms from './pages/terms/terms.svelte'

  let pathname = $state(window.location.pathname)

  const navigate = (to: string) => {
    history.pushState(null, '', to)
    pathname = to
  }

  const onPopState = () => {
    pathname = window.location.pathname
  }
</script>

<svelte:window onpopstate={onPopState} />

{#if pathname === '/privacy'}
  <Privacy />
{:else if pathname === '/terms'}
  <Terms />
{:else}
  <Share />
{/if}

<small>
  <button data-ghost onclick={() => navigate('/')}>{new Date().getFullYear()} Ivan Popov</button>
  /
  <button data-ghost onclick={() => navigate('/privacy')}>Privacy</button>
  /
  <button data-ghost onclick={() => navigate('/terms')}>Terms</button>
</small>

<style>
  small {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 1;
    padding: 1rem 0.5rem calc(1rem + env(safe-area-inset-bottom, 0px));
    text-align: center;
    color: var(--muted-foreground);
    background: var(--background);
  }
</style>

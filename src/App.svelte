<script lang="ts">
  import Privacy from './screens/Privacy/Privacy.svelte'
  import Share from './screens/Share/Share.svelte'
  import Terms from './screens/Terms/Terms.svelte'

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
  <button onclick={() => navigate('/')}>© {new Date().getFullYear()} Ivan Popov</button>
  /
  <button onclick={() => navigate('/privacy')}>Privacy</button>
  /
  <button onclick={() => navigate('/terms')}>Terms</button>
</small>

<style>
  small {
    position: fixed;
    bottom: calc(1rem + env(safe-area-inset-bottom, 0px));
    left: 0;
    right: 0;
    text-align: center;
    color: var(--muted-foreground);
  }
</style>

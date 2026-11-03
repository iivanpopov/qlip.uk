<script lang="ts">
  import { onMount } from 'svelte'

  import Privacy from './screens/Privacy/Privacy.svelte'
  import Share from './screens/Share/Share.svelte'
  import Terms from './screens/Terms/Terms.svelte'

  let pathname = $state(window.location.pathname)

  const navigate = (to: string) => {
    history.pushState(null, '', to)
    pathname = to
  }

  onMount(() => {
    const handlePopState = () => {
      pathname = window.location.pathname
    }

    window.addEventListener('popstate', handlePopState)

    return () => window.removeEventListener('popstate', handlePopState)
  })
</script>

{#if pathname === '/privacy'}
  <Privacy />
{:else if pathname === '/terms'}
  <Terms />
{:else}
  <Share />
{/if}

<footer>
  <small>
    <button onclick={() => navigate('/')}>© {new Date().getFullYear()} Ivan Popov</button>
    <span>/</span>
    <button onclick={() => navigate('/privacy')}>Privacy</button>
    <span>/</span>
    <button onclick={() => navigate('/terms')}>Terms</button>
  </small>
</footer>

<style>
  button {
    background: none;
    border: none;
    color: var(--muted-foreground);
  }

  footer {
    position: fixed;
    bottom: calc(1rem + env(safe-area-inset-bottom, 0px));
    left: 0;
    right: 0;
    display: flex;
    justify-content: center;
    color: var(--muted-foreground);
  }
</style>

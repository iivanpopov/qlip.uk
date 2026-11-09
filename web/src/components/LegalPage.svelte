<script lang="ts">
  import type { Snippet } from 'svelte'

  let { title, children }: { title: string; children: Snippet } = $props()
</script>

<svelte:head>
  <title>{title} — qlip</title>
</svelte:head>

<main>
  <header>
    <h1>{title}</h1>
    <p>Last updated <time datetime="2026-11-09">9 November 2026</time></p>
  </header>
  {@render children()}
</main>

<style>
  main {
    width: min(90vw, 700px);
    margin: 3rem auto;
    padding-bottom: calc(3rem + env(safe-area-inset-bottom, 0px));
    line-height: 1.7;
    overflow-wrap: anywhere;
  }

  header {
    margin-bottom: 2rem;
  }

  h1 {
    margin-bottom: 0.5rem;
    font-size: clamp(1.5rem, 5vw, 2rem);
    font-weight: 400;
    line-height: 1.3;
  }

  header p {
    color: var(--muted-foreground);
    font-size: 0.875rem;
  }

  main :global(section) {
    margin-top: 2rem;
  }

  main :global(h2) {
    margin-bottom: 0.75rem;
    font-size: 1.125rem;
    font-weight: 400;
    line-height: 1.5;
  }

  main :global(p + p),
  main :global(ul) {
    margin-top: 0.75rem;
  }

  main :global(ul) {
    padding-left: 1.5rem;
  }

  main :global(li + li) {
    margin-top: 0.5rem;
  }

  main :global(a) {
    color: inherit;
    text-underline-offset: 0.2em;
  }

  main :global(a:hover) {
    text-decoration-thickness: 2px;
  }

  main :global(a:focus-visible) {
    outline: 2px solid currentColor;
    outline-offset: 3px;
  }

  main :global(code) {
    font: inherit;
  }
</style>

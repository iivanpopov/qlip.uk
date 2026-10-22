<script lang="ts">
  import type { Snippet } from 'svelte'

  let { children }: { children: Snippet } = $props()
</script>

<div class="layout">
  <header></header>

  <main>
    {@render children()}
  </main>

  <footer></footer>
</div>

<style>
  .layout {
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
  }

  header,
  footer {
    height: 10dvh;
  }

  main {
    display: flex;
    height: 80dvh;
    justify-content: center;
    align-items: center;
    margin-bottom: 10dvh;
  }
</style>

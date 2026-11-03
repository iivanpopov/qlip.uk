<script lang="ts">
  import { onMount } from 'svelte'
  import { encode } from 'uqr'

  let { code, size }: { code: string; size: number } = $props()

  let canvas: HTMLCanvasElement

  onMount(() => {
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const pixels = encode(code, { ecc: 'M', border: 0, boostEcc: false })

    ctx.fillStyle = '#c7d1d9'

    const pixelSize = Math.floor(size / pixels.size)

    for (let row = 0; row < pixels.size; row++) {
      for (let col = 0; col < pixels.size; col++) {
        if (!pixels.data[row][col]) continue

        ctx.fillRect(col * pixelSize, row * pixelSize, pixelSize, pixelSize)
      }
    }
  })
</script>

<canvas bind:this={canvas} width={size} height={size}></canvas>

<style>
  canvas {
    width: 100%;
    height: auto;
  }
</style>

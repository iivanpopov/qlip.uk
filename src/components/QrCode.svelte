<script lang="ts">
  import { create as createQr } from 'qrcode'
  import { onMount } from 'svelte'

  let { code, size }: { code: string; size: number } = $props()

  let canvas: HTMLCanvasElement

  onMount(() => {
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let pixels = createQr(code).modules

    ctx.fillStyle = '#c7d1d9'

    const pixelSize = size / pixels.size

    for (let row = 0; row < pixels.size; row++) {
      for (let col = 0; col < pixels.size; col++) {
        if (!pixels.get(row, col)) continue

        ctx.fillRect(col * pixelSize, row * pixelSize, pixelSize, pixelSize)
      }
    }
  })
</script>

<canvas bind:this={canvas} width={size} height={size}></canvas>

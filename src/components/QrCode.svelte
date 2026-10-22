<script lang="ts">
  import { create as createQr } from 'qrcode'
  import { onMount } from 'svelte'

  let { code }: { code: string } = $props()

  const PIXEL_SIZE = 20

  let canvas: HTMLCanvasElement

  onMount(() => {
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let pixels = createQr(code).modules

    canvas.width = pixels.size * PIXEL_SIZE
    canvas.height = pixels.size * PIXEL_SIZE

    ctx.fillStyle = '#c7d1d9'

    for (let row = 0; row < pixels.size; row++) {
      for (let col = 0; col < pixels.size; col++) {
        if (!pixels.get(row, col)) continue

        ctx.fillRect(col * PIXEL_SIZE, row * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE)
      }
    }
  })
</script>

<canvas bind:this={canvas}></canvas>

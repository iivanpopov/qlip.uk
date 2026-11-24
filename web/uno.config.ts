import extractorSvelte from '@unocss/extractor-svelte'
import { defineConfig, presetIcons } from 'unocss'

export default defineConfig({
  extractors: [extractorSvelte()],
  presets: [
    presetIcons({
      extraProperties: {
        display: 'inline-block',
        'vertical-align': 'middle',
      },
    }),
  ],
})

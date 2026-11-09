<script lang="ts">
  import { onMount } from 'svelte'

  import { TURNSTILE_SITE_KEY } from '#/config'

  interface RenderOptions {
    sitekey: string
    action?: string
    cData?: string
    appearance?: 'always' | 'execute' | 'interaction-only'
    execution?: 'render' | 'execute'
    theme?: 'auto' | 'light' | 'dark'
    size?: 'normal' | 'flexible' | 'compact'
    language?: string
    tabindex?: number
    retry?: 'auto' | 'never'
    'retry-interval'?: number
    'refresh-expired'?: 'auto' | 'manual' | 'never'
    'refresh-timeout'?: 'auto' | 'manual' | 'never'
    'response-field'?: boolean
    'response-field-name'?: string
    'feedback-enabled'?: boolean
    'offlabel-show-privacy'?: boolean
    'offlabel-show-help'?: boolean
    callback?: (token: string) => void
    'error-callback'?: (errorCode: string) => boolean | void
    'expired-callback'?: () => void
    'timeout-callback'?: () => void
    'before-interactive-callback'?: () => void
    'after-interactive-callback'?: () => void
    'unsupported-callback'?: () => void
  }

  type WidgetTarget = string | HTMLElement

  interface Turnstile {
    ready: (callback: () => void) => void
    render: (container: WidgetTarget, options: RenderOptions) => string | undefined
    execute: (container: WidgetTarget, options?: RenderOptions) => void
    getResponse: (container?: WidgetTarget) => string | undefined
    isExpired: (container?: WidgetTarget) => boolean
    reset: (container?: WidgetTarget) => void
    remove: (container: WidgetTarget) => void
  }

  let container: HTMLDivElement

  let { onToken }: { onToken: (token?: string) => void } = $props()

  onMount(() => {
    const { turnstile } = globalThis as typeof globalThis & { turnstile: Turnstile }
    if (!turnstile) return

    const widgetId = turnstile.render(container, {
      sitekey: TURNSTILE_SITE_KEY,
      appearance: 'interaction-only',
      callback: (token) => onToken(token),
      'expired-callback': () => onToken(undefined),
      'error-callback': () => onToken(undefined),
    })

    return () => turnstile.remove(widgetId!)
  })
</script>

<div bind:this={container}></div>

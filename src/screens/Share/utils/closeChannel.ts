export function closeChannel(channel: RTCDataChannel | null) {
  if (channel?.readyState === 'closed' || !channel) return Promise.resolve()
  return new Promise<void>((resolve) => {
    channel?.addEventListener('close', () => resolve(), { once: true })
    if (channel?.readyState !== 'closing') channel?.close()
  })
}

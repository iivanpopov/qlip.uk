export function closeWebSocket(ws: WebSocket | null) {
  if (ws?.readyState === ws?.CLOSED || !ws) return Promise.resolve()
  return new Promise<void>((resolve) => {
    ws?.addEventListener('close', () => resolve(), { once: true })
    if (ws?.readyState !== WebSocket.CLOSING) ws?.close(1000)
  })
}

export const wss = new WebSocket(import.meta.env.VITE_WS_URL)

export function joinRoom(roomId: string) {
  if (wss.readyState === WebSocket.OPEN) {
    wss.send(JSON.stringify({ type: 'join', roomId }))
  } else {
    wss.addEventListener('open', function onOpen() {
      wss.send(JSON.stringify({ type: 'join', roomId }))
      wss.removeEventListener('open', onOpen)
    })
  }
}

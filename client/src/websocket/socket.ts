export const ws = new WebSocket('ws://localhost:1234')

export function joinRoom(roomId: string) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'join', roomId }))
  } else {
    ws.addEventListener('open', function onOpen() {
      ws.send(JSON.stringify({ type: 'join', roomId }))
      ws.removeEventListener('open', onOpen)
    })
  }
}

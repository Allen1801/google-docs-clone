export const wss = new WebSocket(import.meta.env.VITE_WS_URL)

const messageQueue: string[] = []

wss.addEventListener('open', () => {
  console.log('✅ WebSocket connected')
  
  // Flush queued messages
  while (messageQueue.length > 0) {
    const msg = messageQueue.shift()
    if (msg) wss.send(msg)
  }
})

wss.addEventListener('close', () => {
  console.log('❌ WebSocket disconnected')
})

wss.addEventListener('error', (error) => {
  console.error('WebSocket error:', error)
})

// Safe send function
export function safeSend(message: object) {
  const msgString = JSON.stringify(message)
  
  if (wss.readyState === WebSocket.OPEN) {
    wss.send(msgString)
  } else {
    // Queue message to send when connected
    messageQueue.push(msgString)
  }
}

export function joinRoom(roomId: string) {
  safeSend({ type: 'join', roomId })
}
import { WebSocketServer } from 'ws'
import 'dotenv/config'
import { getRoom, rooms } from './roomManager.js'  // Add rooms import
import { MESSAGE_TYPES } from './types.js'

const PORT = process.env.PORT || 1234

const wss = new WebSocketServer({ 
  port: PORT, 
  host: '0.0.0.0'
})

// Clean up stale presence data every 30 seconds
// MOVE THIS OUTSIDE - it should run once, not per connection
setInterval(() => {
  const now = Date.now()
  const STALE_TIMEOUT = 10000 // 10 seconds

  for (const [roomId, room] of rooms.entries()) {
    for (const [clientID, presence] of room.presence.entries()) {
      if (now - presence.lastSeen > STALE_TIMEOUT) {
        room.presence.delete(clientID)
        
        // Broadcast updated presence to room
        const users = Array.from(room.presence.values())
        for (const client of room.clients) {
          if (client.readyState === 1) { // Check if connection is open
            client.send(JSON.stringify({
              type: MESSAGE_TYPES.PRESENCE,
              payload: users
            }))
          }
        }
      }
    }
  }
}, 30000)

wss.on('connection', (ws) => {
  let currentRoom = null

  ws.on('message', (raw) => {
    const msg = JSON.parse(raw.toString())

    if (msg.type === MESSAGE_TYPES.JOIN) {
      currentRoom = msg.roomId;
      const room = getRoom(msg.roomId);
      room.clients.add(ws);

      // Send current doc directly
      ws.send(JSON.stringify({
        type: MESSAGE_TYPES.INIT,
        doc: room.doc || { type: 'doc', content: [] },
        roomId: currentRoom,
        version: room.version,
        title: room.title
      }));
      return;
    }

    if (!currentRoom) return
    const room = getRoom(currentRoom)

    // STEPS
    if (msg.type === MESSAGE_TYPES.STEPS) {
      if (msg.doc) room.doc = msg.doc
      if (!room.steps) room.steps = []
      room.steps.push(...msg.steps)
      room.version++
      for (const client of room.clients) {
        if (client !== ws) client.send(JSON.stringify(msg))
      }
    }

    // PRESENCE
    if (msg.type === MESSAGE_TYPES.PRESENCE) {
      room.presence.set(msg.payload.clientID, msg.payload)
      const users = Array.from(room.presence.values())
      for (const client of room.clients) {
        client.send(JSON.stringify({
          type: MESSAGE_TYPES.PRESENCE,
          payload: users
        }))
      }
    }

    // TITLE
    if (msg.type === MESSAGE_TYPES.TITLE) {
      room.title = msg.title
      for (const client of room.clients) {
        if (client !== ws) {
          client.send(JSON.stringify({
            type: MESSAGE_TYPES.TITLE,
            roomId: currentRoom,
            clientID: msg.clientID,
            title: msg.title
          }))
        }
      }
    }
  })

  ws.on('close', () => {
    if (!currentRoom) return
    getRoom(currentRoom).clients.delete(ws)
  })
})

console.log('✅ WS server running at port', PORT)
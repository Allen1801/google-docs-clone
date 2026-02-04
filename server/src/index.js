import { WebSocketServer } from 'ws'
import { getRoom } from './roomManager.js'
import { MESSAGE_TYPES } from './types.js'

const wss = new WebSocketServer({ port: 1234 })

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

console.log('✅ WS server running at ws://localhost:1234')

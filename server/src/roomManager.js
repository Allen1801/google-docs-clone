export const rooms = new Map()

export function getRoom(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      doc: null,
      version: 0,
      title: 'Untitled Document',
      clients: new Set(),
      presence: new Map()
    })
  }

  return rooms.get(roomId)
}

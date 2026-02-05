import { useEffect, useRef, useState } from 'react'
import { wss, joinRoom } from '../../../websocket/socket'

interface DocumentHeaderProps {
  title: string
  onTitleChange: (title: string) => void
  documentId: string | undefined
}

export default function DocumentHeader({ title, onTitleChange, documentId }: DocumentHeaderProps) {
  const localClientID = useRef(crypto.randomUUID())
  const [localTitle, setLocalTitle] = useState(title)

  // Sync prop -> local state
  useEffect(() => {
    console.log('[DocumentHeader] Prop title changed -> localTitle:', title)
    setLocalTitle(title)
  }, [title])

  // Join room once
  useEffect(() => {
    if (!documentId) return
    console.log('[DocumentHeader] Joining room:', documentId)
    joinRoom(documentId)
  }, [documentId])

  // Handle incoming WS messages
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      const msg = JSON.parse(e.data)
      console.log('[DocumentHeader] WS message received:', msg)

      // INIT message
      if (msg.type === 'init' && msg.roomId === documentId) {
        const newTitle = msg.title ?? 'Untitled Document'
        console.log('[DocumentHeader] INIT: setting title to', newTitle)
        setLocalTitle(newTitle)
        onTitleChange(newTitle)
      }

      // TITLE update from other clients
      if (msg.type === 'title' && msg.clientID !== localClientID.current && msg.roomId === documentId) {
        console.log('[DocumentHeader] TITLE update received:', msg.title)
        setLocalTitle(msg.title)
        onTitleChange(msg.title)
      }
    }

    wss.addEventListener('message', handleMessage)
    return () => wss.removeEventListener('message', handleMessage)
  }, [documentId, onTitleChange])

  // Handle local input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value
    console.log('[DocumentHeader] Local input changed:', newTitle)
    setLocalTitle(newTitle)
    onTitleChange(newTitle)

    if (!documentId) return

    console.log('[DocumentHeader] Sending TITLE update:', newTitle)
    wss.send(JSON.stringify({
      type: 'title',
      roomId: documentId,
      clientID: localClientID.current,
      title: newTitle
    }))
  }

  return (
    <header style={{ padding: '16px 24px', borderBottom: '1px solid #e0e0e0', flexShrink: 0 }}>
      <input
        type="text"
        value={localTitle}
        onChange={handleChange}
        style={{
          fontSize: 24,
          fontWeight: 'bold',
          border: '1px solid #ddd',
          borderRadius: 4,
          padding: '8px 12px',
          width: '100%',
          maxWidth: 500,
          marginBottom: 8,
        }}
        placeholder="Enter document title..."
      />
      <p style={{ color: '#555', marginTop: 6, fontSize: 14 }}>Document ID: {documentId}</p>
    </header>
  )
}

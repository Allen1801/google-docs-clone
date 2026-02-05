import { useEffect, useRef, useState, useMemo } from 'react'
import { EditorState, Plugin, PluginKey } from 'prosemirror-state'
import { EditorView, Decoration, DecorationSet } from 'prosemirror-view'
import { schema as basicSchema } from 'prosemirror-schema-basic'
import { history } from 'prosemirror-history'
import { keymap } from 'prosemirror-keymap'
import { Node as ProseMirrorNode } from 'prosemirror-model'
import { Step } from 'prosemirror-transform'
import { customKeymap } from '../config/editorConfig'
import { serializeNode } from '../utils/serializer'
import { wss, joinRoom, safeSend } from '../../../websocket/socket'

interface EditorProps {
  roomId: string
  onUpdate: (markdown: string) => void
  viewRef: React.MutableRefObject<EditorView | null>
  username?: string
  userColor?: string
}

interface RemoteUser {
  clientID: string
  username: string
  color: string
  selection: { anchor: number; head: number } | null
  lastSeen: number
}

const awarenessPluginKey = new PluginKey('awareness')

function createAwarenessPlugin(
  remoteUsers: Map<string, RemoteUser>
) {
  return new Plugin({
    key: awarenessPluginKey,
    state: {
      init() {
        return DecorationSet.empty
      },
      apply(tr, decorations) {
        // Map decorations through transaction
        decorations = decorations.map(tr.mapping, tr.doc)

        // Rebuild decorations from remote users
        const decos: Decoration[] = []
        
        remoteUsers.forEach((user) => {
          if (!user.selection) return

          const { anchor, head } = user.selection
          const from = Math.min(anchor, head)
          const to = Math.max(anchor, head)

          // Ensure positions are valid
          if (from < 0 || to > tr.doc.content.size) return

          // Selection range decoration
          if (from !== to) {
            decos.push(
              Decoration.inline(from, to, {
                class: 'remote-selection',
                style: `background-color: ${user.color}30;`
              })
            )
          }

          // Cursor decoration
          const cursorWidget = document.createElement('span')
          cursorWidget.className = 'remote-cursor'
          cursorWidget.style.borderLeftColor = user.color
          
          const label = document.createElement('span')
          label.className = 'remote-cursor-label'
          label.style.backgroundColor = user.color
          label.textContent = user.username
          cursorWidget.appendChild(label)

          decos.push(Decoration.widget(head, cursorWidget, { side: -1 }))
        })

        return DecorationSet.create(tr.doc, decos)
      }
    },
    props: {
      decorations(state) {
        return this.getState(state)
      }
    }
  })
}

export default function Editor({ 
  roomId, 
  onUpdate, 
  viewRef,
  username = 'Anonymous',
  userColor
}: EditorProps) {
  // Generate stable color once
  const stableColor = useMemo(() => {
    if (userColor) return userColor
    
    // Generate light pastel colors
    const hue = Math.floor(Math.random() * 360)
    const saturation = 60 + Math.random() * 20 // 60-80%
    const lightness = 65 + Math.random() * 15  // 65-80%
    
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`
  }, [userColor])

    // Persist clientID across refreshes
  const localClientID = useMemo(() => {
    const stored = sessionStorage.getItem('clientID')
    if (stored) return stored
    
    const newID = crypto.randomUUID()
    sessionStorage.setItem('clientID', newID)
    return newID
  }, [])

  const editorRef = useRef<HTMLDivElement>(null)
  // const localClientID = useRef(crypto.randomUUID())
  const pendingSteps = useRef<any[]>([])
  const roomVersion = useRef(0)
  const remoteUsers = useRef(new Map<string, RemoteUser>())
  const [activeUsers, setActiveUsers] = useState<RemoteUser[]>([])

  // Throttled selection broadcast
  const sendSelection = useRef<number | null>(null)
  const broadcastPresence = (selection: { anchor: number; head: number } | null) => {
    if (sendSelection.current) clearTimeout(sendSelection.current)
    
    sendSelection.current = setTimeout(() => {
      safeSend({
        type: 'presence',
        roomId,
        payload: {
          clientID: localClientID,
          username,
          color: stableColor,
          selection,
          lastSeen: Date.now()
        }
      })
    }, 100)
  }

  useEffect(() => {
    if (!roomId || !editorRef.current) return

    joinRoom(roomId)

    // Send initial presence
    broadcastPresence(null)

    const awarenessPlugin = createAwarenessPlugin(remoteUsers.current)

    let state = EditorState.create({
      schema: basicSchema,
      plugins: [history(), keymap(customKeymap), awarenessPlugin]
    })

    viewRef.current = new EditorView(editorRef.current, {
      state,
      dispatchTransaction(tr) {
        const view = viewRef.current!
        const newState = view.state.apply(tr)
        view.updateState(newState)

        // Broadcast selection changes
        if (tr.selectionSet && !tr.getMeta('remote')) {
          const { from, to } = tr.selection
          broadcastPresence({ anchor: from, head: to })
        }

        if (!tr.docChanged) return

        if (!tr.getMeta('remote')) {
          pendingSteps.current.push(...tr.steps.map(s => s.toJSON()))
          requestAnimationFrame(() => {
            if (!pendingSteps.current.length) return
            const docJson = view.state.doc.toJSON()
            safeSend({
              type: 'steps',
              roomId,
              clientID: localClientID,
              doc: docJson,
              steps: pendingSteps.current
            })
            pendingSteps.current = []
          })
        }

        onUpdate(serializeNode(newState.doc))
      }
    })

    const handleMessage = (e: MessageEvent) => {
      try {
        const msg = JSON.parse(e.data)

        // Handle init
        if (msg.type === 'init' && msg.roomId === roomId) {
          if (msg.doc) {
            const doc = ProseMirrorNode.fromJSON(basicSchema, msg.doc)
            const tr = viewRef.current!.state.tr.replaceWith(
              0, 
              viewRef.current!.state.doc.content.size, 
              doc.content
            )
            tr.setMeta('remote', true)
            viewRef.current!.dispatch(tr)
            onUpdate(serializeNode(viewRef.current!.state.doc))
          }
          roomVersion.current = msg.version ?? 0
          return
        }

        // Handle remote steps
        if (msg.type === 'steps' && msg.clientID !== localClientID && msg.roomId === roomId) {
          const view = viewRef.current!
          let tr = view.state.tr
          
          msg.steps.forEach((stepJSON: any) => {
            const step = Step.fromJSON(view.state.schema, stepJSON)
            const result = tr.maybeStep(step)
            if (result.failed) {
              console.error('Step application failed:', result.failed)
            }
          })
          
          tr.setMeta('remote', true)
          view.dispatch(tr)
          onUpdate(serializeNode(view.state.doc))
        }

        // Handle presence updates (array of all users from server)
        if (msg.type === 'presence') {
          const users = msg.payload as Array<{
            clientID: string
            username: string
            color: string
            selection: { anchor: number; head: number } | null
            lastSeen: number
          }>

          // Clear and rebuild remote users map (excluding self)
          remoteUsers.current.clear()
          
          users.forEach(user => {
            if (user.clientID !== localClientID) {
              remoteUsers.current.set(user.clientID, user)
            }
          })

          setActiveUsers(Array.from(remoteUsers.current.values()))
          
          // Trigger decoration update
          if (viewRef.current) {
            viewRef.current.dispatch(viewRef.current.state.tr)
          }
        }

      } catch (err) {
        console.error('Message handling error:', err)
      }
    }

    wss.addEventListener('message', handleMessage)

    // Send periodic heartbeat to maintain presence
    const heartbeat = setInterval(() => {
      if (viewRef.current) {
        const { from, to } = viewRef.current.state.selection
        broadcastPresence({ anchor: from, head: to })
      }
    }, 3000)

    return () => {
      // Final presence update on unmount (null selection = leaving)
      safeSend({
        type: 'presence',
        roomId,
        payload: {
          clientID: localClientID,
          username,
          color: stableColor,
          selection: null,
          lastSeen: Date.now()
        }
      })
      
      viewRef.current?.destroy()
      wss.removeEventListener('message', handleMessage)
      clearInterval(heartbeat)
      if (sendSelection.current) clearTimeout(sendSelection.current)
    }
  }, [roomId, onUpdate, viewRef, username, stableColor])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Active users indicator */}
      <div style={{ 
        padding: '8px 24px', 
        borderBottom: '1px solid #e0e0e0',
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
        backgroundColor: '#fafafa'
      }}>
        <span style={{ fontSize: '14px', color: '#666', fontWeight: 500 }}>
          {activeUsers.length > 0 
            ? `${activeUsers.length + 1} ${activeUsers.length === 0 ? 'person' : 'people'} editing` 
            : 'Only you'}
        </span>
        <div style={{ display: 'flex', gap: '6px', marginLeft: 'auto' }}>
          {/* Show local user first */}
          <div
            title={`${username} (you)`}  // This already has tooltip
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: stableColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '12px',
              fontWeight: 'bold',
              border: '2px solid white',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              cursor: 'pointer'  // Add cursor pointer to show it's hoverable
            }}
          >
            {username[0].toUpperCase()}
          </div>
          
          {/* Show remote users */}
          {activeUsers.map(user => (
            <div
              key={user.clientID}
              title={user.username}  // This already has tooltip
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: user.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '12px',
                fontWeight: 'bold',
                border: '2px solid white',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                cursor: 'pointer'  // Add cursor pointer to show it's hoverable
              }}
            >
              {user.username[0].toUpperCase()}
            </div>
          ))}
        </div>
      </div>

      <div 
        ref={editorRef}
        className="ProseMirror" 
        style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: 24,
          caretColor: stableColor
        }} 
      />
    </div>
  )
}
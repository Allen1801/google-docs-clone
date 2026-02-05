import { useEffect, useRef } from 'react'
import { EditorState } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'
import { schema as basicSchema } from 'prosemirror-schema-basic'
import { history } from 'prosemirror-history'
import { keymap } from 'prosemirror-keymap'
import { Node as ProseMirrorNode } from 'prosemirror-model'
import { Step } from 'prosemirror-transform'
import { customKeymap } from '../config/editorConfig'
import { serializeNode } from '../utils/serializer'
import { wss, joinRoom } from '../../../websocket/socket'

interface EditorProps {
  roomId: string
  onUpdate: (markdown: string) => void
  viewRef: React.MutableRefObject<EditorView | null>
}

export default function Editor({ roomId, onUpdate, viewRef }: EditorProps) {
  const localClientID = useRef(crypto.randomUUID())
  const pendingSteps = useRef<any[]>([])
  const roomVersion = useRef(0)

  const sendPendingSteps = () => {
    if (!pendingSteps.current.length) return
    const docJson = viewRef.current!.state.doc.toJSON()
    wss.send(JSON.stringify({
      type: 'steps',
      roomId,
      clientID: localClientID.current,
      doc: docJson,
      steps: pendingSteps.current
    }))
    pendingSteps.current = []
  }

  useEffect(() => {
    if (!roomId) return

    joinRoom(roomId)

    // Temporary initial empty state
    let state = EditorState.create({
      schema: basicSchema,
      plugins: [history(), keymap(customKeymap)]
    })

    // Initialize editor view
    viewRef.current = new EditorView(document.createElement('div'), {
      state,
      dispatchTransaction(tr) {
        const view = viewRef.current!
        const newState = view.state.apply(tr)
        view.updateState(newState)

        if (!tr.docChanged) return

        if (!tr.getMeta('remote')) {
          pendingSteps.current.push(...tr.steps.map(s => s.toJSON()))
          requestAnimationFrame(sendPendingSteps)
        }

        onUpdate(serializeNode(newState.doc))
      }
    })

    const container = document.querySelector('.ProseMirror') || document.body
    container.appendChild(viewRef.current.dom)

    const handleMessage = (e: MessageEvent) => {
      const msg = JSON.parse(e.data)

      // --- Apply init document if joining mid-edit ---
      if (msg.type === 'init' && msg.roomId === roomId) {
        console.log('[Editor] INIT document received', msg.doc)
        if (msg.doc) {
          const doc = ProseMirrorNode.fromJSON(basicSchema, msg.doc)
          const tr = viewRef.current!.state.tr.replaceWith(0, viewRef.current!.state.doc.content.size, doc.content)
          viewRef.current!.dispatch(tr)
          onUpdate(serializeNode(viewRef.current!.state.doc))
        }
        if (msg.version !== undefined) roomVersion.current = msg.version
        return
      }

      // Apply steps from other clients
      if (msg.type === 'steps' && msg.clientID !== localClientID.current && msg.roomId === roomId) {
        const view = viewRef.current!
        let tr = view.state.tr
        msg.steps.forEach((stepJSON: any) => {
          const step = Step.fromJSON(view.state.schema, stepJSON)
          tr = tr.step(step)
        })
        tr.setMeta('remote', true)
        view.dispatch(tr)
        onUpdate(serializeNode(viewRef.current!.state.doc))
      }
    }

    wss.addEventListener('message', handleMessage)

    return () => {
      viewRef.current?.destroy()
      wss.removeEventListener('message', handleMessage)
    }
  }, [roomId, onUpdate, viewRef])

  return <div className="ProseMirror" style={{ flex: 1, overflowY: 'auto', padding: 24 }} />
}

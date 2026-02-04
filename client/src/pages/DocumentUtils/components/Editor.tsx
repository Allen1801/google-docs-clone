import React, { useEffect, useRef } from 'react'
import { EditorState } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'
import 'prosemirror-view/style/prosemirror.css'
import { schema as basicSchema } from 'prosemirror-schema-basic'
import { history } from 'prosemirror-history'
import { keymap } from 'prosemirror-keymap'
import { customKeymap } from '../config/editorConfig'
import { serializeNode } from '../utils/serializer'

interface EditorProps {
  onUpdate: (markdown: string) => void
  viewRef: React.MutableRefObject<EditorView | null>
}

export default function Editor({ onUpdate, viewRef }: EditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null)
  const onUpdateRef = useRef(onUpdate)

  // Keep the onUpdate ref current
  useEffect(() => {
    onUpdateRef.current = onUpdate
  }, [onUpdate])

  useEffect(() => {
    console.log('Document component mounted')
    if (!editorRef.current) {
      console.log('editorRef.current is null')
      return
    }

    const state = EditorState.create({
      schema: basicSchema,
      plugins: [
        history(),
        keymap(customKeymap),
      ],
    })

    viewRef.current = new EditorView(editorRef.current, {
      state,
      dispatchTransaction(tr) {
        console.log('dispatchTransaction called, transaction:', tr)
        if (!viewRef.current) {
          console.log('viewRef.current is null in dispatchTransaction')
          return
        }
        const newState = viewRef.current.state.apply(tr)
        console.log('newState applied')
        viewRef.current.updateState(newState)
        const markdown = serializeNode(newState.doc)
        console.log('markdown after transaction:', markdown)
        onUpdateRef.current(markdown)  // ← Changed from onUpdate to onUpdateRef.current
      }
    })

    console.log('EditorView created')
    const initialMarkdown = serializeNode(viewRef.current.state.doc)
    onUpdateRef.current(initialMarkdown)  // ← Changed from onUpdate to onUpdateRef.current

    return () => {
      if (viewRef.current) viewRef.current.destroy()
    }
  }, [])  // ← Changed from [onUpdate, viewRef] to []

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
      <div ref={editorRef} className="ProseMirror" />
    </div>
  )
}
import React, { useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { EditorState } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'
import { schema as basicSchema } from 'prosemirror-schema-basic'
import { history } from 'prosemirror-history'
import { keymap } from 'prosemirror-keymap'
import { baseKeymap } from 'prosemirror-commands'

export default function DocumentPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const editorRef = useRef<HTMLDivElement | null>(null)
  const viewRef = useRef<EditorView | null>(null)

  useEffect(() => {
    if (!editorRef.current) return

    const state = EditorState.create({
      schema: basicSchema,
      plugins: [history(), keymap(baseKeymap)],
    })

    viewRef.current = new EditorView(editorRef.current, {
      state,
    })

    return () => {
      if (viewRef.current) viewRef.current.destroy()
    }
  }, [])

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui, Arial' }}>
      <header>
        <h2 style={{ margin: 0 }}>Document</h2>
        <p style={{ color: '#555', marginTop: 6 }}>Document ID: {id}</p>
      </header>

      <main style={{ marginTop: 24 }}>
        <div>
          <div ref={editorRef} className="ProseMirror" />
        </div>

        <div style={{ marginTop: 12 }}>
          <button onClick={() => navigate('/')}>Back Home</button>
        </div>
      </main>
    </div>
  )
}

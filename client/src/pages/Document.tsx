import React, { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { EditorState, Plugin } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'
import 'prosemirror-view/style/prosemirror.css'
import { schema as basicSchema } from 'prosemirror-schema-basic'
import { history } from 'prosemirror-history'
import { keymap } from 'prosemirror-keymap'
import { baseKeymap } from 'prosemirror-commands'
import MarkdownIt from 'markdown-it'

const md = new MarkdownIt()

// Custom Tab key handler
const tabHandler = () => (state: any, dispatch: any) => {
  const spaces = '    ' // 4 spaces for tab
  dispatch(state.tr.insertText(spaces))
  return true
}

const customKeymap = {
  ...baseKeymap,
  'Tab': tabHandler(),
}

function serializeNode(node: any): string {
  if (node.type.name === 'doc') {
    const result: string[] = []
    node.content.forEach((child: any) => {
      result.push(serializeNode(child))
    })
    return result.join('')
  }
  
  if (node.type.name === 'text') {
    return node.text
  }

  if (node.type.name === 'paragraph') {
    let content = ''
    if (node.content) {
      const contentArray: string[] = []
      node.content.forEach((child: any) => {
        contentArray.push(serializeNode(child))
      })
      content = contentArray.join('')
    }
    return content + '\n\n'
  }

  if (node.type.name === 'heading') {
    const level = node.attrs?.level || 1
    let content = ''
    if (node.content) {
      const contentArray: string[] = []
      node.content.forEach((child: any) => {
        contentArray.push(serializeNode(child))
      })
      content = contentArray.join('')
    }
    return '#'.repeat(level) + ' ' + content + '\n\n'
  }

  if (node.type.name === 'hard_break') {
    return '\n'
  }

  if (node.type.name === 'bullet_list') {
    let content = ''
    if (node.content) {
      const contentArray: string[] = []
      node.content.forEach((child: any) => {
        contentArray.push(serializeNode(child))
      })
      content = contentArray.join('')
    }
    return content + '\n'
  }

  if (node.type.name === 'ordered_list') {
    let content = ''
    let index = 1
    if (node.content) {
      const contentArray: string[] = []
      node.content.forEach((child: any) => {
        contentArray.push(index + '. ' + serializeNode(child).trim() + '\n')
        index++
      })
      content = contentArray.join('')
    }
    return content + '\n'
  }

  if (node.type.name === 'list_item') {
    let content = ''
    if (node.content) {
      const contentArray: string[] = []
      node.content.forEach((child: any) => {
        contentArray.push(serializeNode(child))
      })
      content = contentArray.join('')
    }
    return '- ' + content.trim() + '\n'
  }

  let content = ''
  if (node.content) {
    const contentArray: string[] = []
    node.content.forEach((child: any) => {
      contentArray.push(serializeNode(child))
    })
    content = contentArray.join('')
  }
  return content
}

export default function DocumentPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const editorRef = useRef<HTMLDivElement | null>(null)
  const viewRef = useRef<EditorView | null>(null)
  const [preview, setPreview] = useState<string>('')

  useEffect(() => {
    console.log('Preview state changed:', preview)
    const html = md.render(preview)
    console.log('Rendered HTML:', html)
  }, [preview])

  useEffect(() => {
    console.log('Document component mounted')
    if (!editorRef.current) {
      console.log('editorRef.current is null')
      return
    }

    const updatePreview = (view: EditorView) => {
      const markdown = serializeNode(view.state.doc)
      console.log('updatePreview called, markdown:', markdown)
      setPreview(markdown)
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
        setPreview(markdown)
      }
    })

    console.log('EditorView created')
    updatePreview(viewRef.current)

    return () => {
      if (viewRef.current) viewRef.current.destroy()
    }
  }, [])

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'row', fontFamily: 'system-ui, Arial', overflow: 'hidden' }}>
      {/* Left side with header and editor */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid #e0e0e0', overflow: 'hidden' }}>
        <header style={{ padding: '16px 24px', borderBottom: '1px solid #e0e0e0', flexShrink: 0 }}>
          <h2 style={{ margin: 0 }}>Document</h2>
          <p style={{ color: '#555', marginTop: 6, fontSize: 14 }}>Document ID: {id}</p>
        </header>
        
        {/* Editor Section */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          <div ref={editorRef} className="ProseMirror" />
        </div>

        <button onClick={() => navigate('/')} style={{ padding: '12px 24px', borderTop: '1px solid #e0e0e0', cursor: 'pointer' }}>
          Back Home
        </button>
      </div>

      {/* Right side with preview */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: '#1e1e1e' }}>
        <h3 style={{ padding: '16px 24px', margin: 0, borderBottom: '1px solid #333', color: '#e0e0e0' }}>Preview</h3>
        <div 
          style={{ 
            flex: 1, 
            overflowY: 'auto', 
            padding: '24px', 
            backgroundColor: '#1e1e1e', 
            color: '#e0e0e0',
            fontSize: '16px',
            lineHeight: '1.6'
          }}
          dangerouslySetInnerHTML={{ __html: md.render(preview) || '<p style="color: #666;">Waiting for content...</p>' }}
        />
      </div>
    </div>
  )
}

import { useRef, useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { EditorView } from 'prosemirror-view'
import DocumentHeader from './components/DocumentHeader'
import Editor from './components/Editor'
import Preview from './components/Preview'
import ActionButtons from './components/ActionButtons'
import { editorStyles } from './config/editorConfig'
import { serializeNode } from './utils/serializer'
import { downloadMarkdown } from './utils/download'

export default function DocumentPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const viewRef = useRef<EditorView | null>(null)
  const [preview, setPreview] = useState<string>('')
  const [title, setTitle] = useState('Untitled Document')

  // Inject styles on mount
  useEffect(() => {
    const styleElement = document.createElement('style')
    styleElement.textContent = editorStyles
    document.head.appendChild(styleElement)
    
    return () => {
      document.head.removeChild(styleElement)
    }
  }, [])

  const handleUpdate = useCallback((markdown: string) => {
    console.log('Preview state changed:', markdown)
    setPreview(markdown)
  }, [])

  const handleDownload = useCallback(() => {
    if (!viewRef.current) return
    const markdown = serializeNode(viewRef.current.state.doc)
    downloadMarkdown(markdown, title)
  }, [title])

  const handleBackHome = useCallback(() => {
    navigate('/')
  }, [navigate])

  const handleShare = useCallback(async () => {
    if (!id) return

    const shareLink = `${window.location.origin}/doc/${id}`

    try {
      await navigator.clipboard.writeText(shareLink)
      alert('Document link copied to clipboard')
    } catch (err) {
      console.error('Failed to copy link', err)
    }
  }, [id])


  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'row', fontFamily: 'system-ui, Arial', overflow: 'hidden' }}>
      
      {/* Left side with header and editor */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid #e0e0e0', overflow: 'hidden' }}>
        <DocumentHeader 
          title={title} 
          onTitleChange={setTitle} 
          documentId={id} 
        />
        
        <Editor 
          roomId={id!}
          onUpdate={handleUpdate} 
          viewRef={viewRef} 
        />

        <ActionButtons 
          onBackHome={handleBackHome}
          onDownload={handleDownload}
          onShare={handleShare}
        />
      </div>

      {/* Right side with preview */}
      <Preview markdown={preview} />
    </div>
  )
}
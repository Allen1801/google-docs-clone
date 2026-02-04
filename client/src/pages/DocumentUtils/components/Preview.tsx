import { md } from '../config/editorConfig'

interface PreviewProps {
  markdown: string
}

export default function Preview({ markdown }: PreviewProps) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: '#1e1e1e' }}>
      <h3 style={{ padding: '16px 24px', margin: 0, borderBottom: '1px solid #333', color: '#e0e0e0' }}>
        Preview
      </h3>
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
        dangerouslySetInnerHTML={{ 
          __html: md.render(markdown) || '<p style="color: #666;">Waiting for content...</p>' 
        }}
      />
    </div>
  )
}
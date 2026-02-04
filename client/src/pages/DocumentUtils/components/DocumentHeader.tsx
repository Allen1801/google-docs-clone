import React from 'react'

interface DocumentHeaderProps {
  title: string
  onTitleChange: (title: string) => void
  documentId: string | undefined
}

export default function DocumentHeader({ title, onTitleChange, documentId }: DocumentHeaderProps) {
  return (
    <header style={{ padding: '16px 24px', borderBottom: '1px solid #e0e0e0', flexShrink: 0 }}>
      <input
        type="text"
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
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
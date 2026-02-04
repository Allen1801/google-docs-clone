interface ActionButtonsProps {
  onBackHome: () => void
  onDownload: () => void
}

export default function ActionButtons({ onBackHome, onDownload }: ActionButtonsProps) {
  return (
    <div style={{ display: 'flex', borderTop: '1px solid #e0e0e0', flexShrink: 0 }}>
      <button 
        onClick={onBackHome} 
        style={{ 
          flex: 1, 
          padding: '12px 24px', 
          cursor: 'pointer', 
          border: 'none', 
          background: '#f5f5f5',
          fontSize: '14px',
          fontWeight: '500'
        }}
      >
        Back Home
      </button>
      <button 
        onClick={onDownload} 
        style={{ 
          flex: 1, 
          padding: '12px 24px', 
          cursor: 'pointer', 
          border: 'none', 
          background: '#007bff', 
          color: 'white',
          fontSize: '14px',
          fontWeight: '500'
        }}
      >
        Download as MD
      </button>
    </div>
  )
}
interface ActionButtonsProps {
  onBackHome: () => void
  onDownload: () => void
  onShare: () => void
}

const palette = {
  primary: '#2563eb', // blue
  secondary: '#4b5563', // gray
  light: '#f3f4f6', // light gray
  textLight: '#ffffff',
}

export default function ActionButtons({ onBackHome, onDownload, onShare }: ActionButtonsProps) {
  return (
    <div style={{ display: 'flex', borderTop: `1px solid ${palette.light}`, flexShrink: 0 }}>
      <button 
        onClick={onBackHome} 
        style={{ 
          flex: 1, 
          padding: '12px 24px', 
          cursor: 'pointer', 
          border: 'none', 
          background: palette.light,
          color: palette.secondary,
          fontSize: '14px',
          fontWeight: 500,
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
          background: palette.primary, 
          color: palette.textLight,
          fontSize: '14px',
          fontWeight: 500,
        }}
      >
        Download as MD
      </button>

      <button
        onClick={onShare}
        style={{
          flex: 1,
          padding: '12px 24px',
          cursor: 'pointer',
          border: 'none',
          background: palette.secondary,
          color: palette.textLight,
          fontSize: '14px',
          fontWeight: 500,
        }}
      >
        Share Document
      </button>
    </div>
  )
}

import { useState } from 'react'

interface UsernameModalProps {
  onSubmit: (username: string) => void
}

export default function UsernameModal({ onSubmit }: UsernameModalProps) {
  const [username, setUsername] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (username.trim()) {
      onSubmit(username.trim())
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '32px',
        maxWidth: '400px',
        width: '90%',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)'
      }}>
        <h2 style={{
          margin: '0 0 8px 0',
          fontSize: '24px',
          fontWeight: 600,
          color: '#1a1a1a'
        }}>
          Join Document
        </h2>
        <p style={{
          margin: '0 0 24px 0',
          fontSize: '14px',
          color: '#666'
        }}>
          Enter your name to start collaborating
        </p>
        
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Your name"
            autoFocus
            style={{
              width: '100%',
              padding: '12px 16px',
              fontSize: '16px',
              border: '2px solid #e0e0e0',
              borderRadius: '8px',
              outline: 'none',
              transition: 'border-color 0.2s',
              boxSizing: 'border-box'
            }}
            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
          />
          
          <button
            type="submit"
            disabled={!username.trim()}
            style={{
              width: '100%',
              marginTop: '16px',
              padding: '12px 16px',
              fontSize: '16px',
              fontWeight: 600,
              color: 'white',
              backgroundColor: username.trim() ? '#3b82f6' : '#9ca3af',
              border: 'none',
              borderRadius: '8px',
              cursor: username.trim() ? 'pointer' : 'not-allowed',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => {
              if (username.trim()) {
                e.currentTarget.style.backgroundColor = '#2563eb'
              }
            }}
            onMouseLeave={(e) => {
              if (username.trim()) {
                e.currentTarget.style.backgroundColor = '#3b82f6'
              }
            }}
          >
            Join
          </button>
        </form>
      </div>
    </div>
  )
}
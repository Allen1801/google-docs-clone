
import { useNavigate, Routes, Route } from 'react-router-dom'
import './App.css'
import DocumentPage from './pages/Document'

function generateDocId() {
  try {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      // @ts-ignore
      return crypto.randomUUID()
    }
  } catch (e) {}
  return Math.random().toString(36).slice(2, 10)
}

export default function App() {
  const navigate = useNavigate()

  const createNewDocument = () => {
    const id = generateDocId()
    navigate(`/doc/${id}`)
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          <div
            className="app-home"
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100vh', // full viewport height
              fontFamily: 'system-ui, Arial',
              textAlign: 'center',
              padding: 24,
            }}
          >
            <header>
              <h1 style={{ margin: 0 }}>Collaborative Markdown</h1>
              <p style={{ color: '#555', marginTop: 6 }}>
                Docs Clone that enables collaborative work for markdown documents.
              </p>
            </header>

            <main style={{ marginTop: 24 }}>
              <button
                onClick={createNewDocument}
                style={{ padding: '10px 16px', fontSize: 16 }}
              >
                New Document
              </button>
            </main>
          </div>
        }
      />
      <Route path="/doc/:id" element={<DocumentPage />} />
    </Routes>
  )
}


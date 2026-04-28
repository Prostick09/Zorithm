import { useState, lazy, Suspense } from 'react'
import { ChatProvider, useChat } from './ChatContext'
import ChatWindow from './ChatWindow'
import Sidebar from '../../shared/components/Sidebar'
import Navbar from '../../shared/components/Navbar'
import './ChatPage.css'

const Visualizer = lazy(() => import('../visualizer/Visualizer'))
const CodeEditorPane = lazy(() => import('../practice/CodeEditorPane'))

// Inner page (needs ChatProvider context)
function ChatPageInner({ theme, onThemeToggle }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [showVisualizer, setShowVisualizer] = useState(false)
  const { messages, activeMode } = useChat()

  return (
    <div className="chat-page">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        theme={theme}
        onThemeToggle={onThemeToggle}
      />

      {/* Mobile overlay */}
      <div
        className={`mobile-overlay ${sidebarOpen ? 'visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* Main area */}
      <main className="chat-main">
        <Navbar
          onMenuToggle={() => setSidebarOpen(v => !v)}
          messageCount={messages.length}
        >
          {/* Add a toggle button for visualizer in navbar if possible, or just render it */}
          <button 
            className="toggle-vis-btn" 
            onClick={() => setShowVisualizer(!showVisualizer)}
            style={{ marginLeft: 'auto', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '20px', padding: '4px 12px', fontSize: '13px', cursor: 'pointer', color: 'var(--text)' }}
          >
            {showVisualizer ? 'Hide Visualizer' : 'Show Visualizer 📊'}
          </button>
        </Navbar>
        <div style={{ display: 'flex', flex: 1, minHeight: 0, flexDirection: 'row' }}>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            <ChatWindow />
          </div>
          {activeMode === 'Code' && (
            <Suspense fallback={<div style={{ flex: '0 0 420px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Loading editor…</div>}>
              <CodeEditorPane />
            </Suspense>
          )}
          {showVisualizer && (
            <Suspense fallback={<div style={{ padding: '2rem', color: 'var(--text-muted)' }}>Loading visualizer…</div>}>
              <Visualizer />
            </Suspense>
          )}
        </div>
      </main>
    </div>
  )
}

export default function ChatPage({ theme, onThemeToggle }) {
  return (
    <ChatProvider>
      <ChatPageInner theme={theme} onThemeToggle={onThemeToggle} />
    </ChatProvider>
  )
}

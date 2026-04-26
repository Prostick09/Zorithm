import { useState } from 'react'
import { useChat } from '../../features/chat/ChatContext'
import { formatRelativeDate, truncate } from '../utils/helpers'
import './Sidebar.css'
import logoImage from '../../assets/logo.jpeg'

const BotIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="10" rx="2"/>
    <circle cx="12" cy="5" r="2"/>
    <path d="M12 7v4"/>
    <line x1="8" y1="16" x2="8" y2="16"/>
    <line x1="12" y1="16" x2="12" y2="16"/>
    <line x1="16" y1="16" x2="16" y2="16"/>
  </svg>
)

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)

const TrashIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/>
  </svg>
)

const MessageIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
  </svg>
)

const ChevronIcon = ({ isOpen }) => (
  <svg
    width="12" height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    style={{ transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s' }}
  >
    <polyline points="6 9 12 15 18 9"/>
  </svg>
)

export default function Sidebar({ isOpen, onClose, theme, onThemeToggle }) {
  const { sessions, startNewChat, removeSession, currentSessionId, loadSession } = useChat()
  const [hoveredSession, setHoveredSession] = useState(null)
  const [historyOpen, setHistoryOpen] = useState(true)

  const handleNewChat = () => {
    startNewChat()
    onClose?.()
  }

  const handleDeleteSession = (e, sessionId) => {
    e.stopPropagation()
    removeSession(sessionId)
  }

  const SUGGESTED_QUERIES = [
    'Binary Search Analysis',
    'Merge Sort Complexity',
    'Dynamic Programming Intro',
    'Graph BFS vs DFS',
    'Dijkstra\'s Algorithm',
    'Hash Table Collisions',
  ]

  return (
    <aside className={`sidebar ${isOpen ? 'sidebar--open' : 'sidebar--closed'}`} aria-label="Chat sidebar">
      {/* ── Logo ─────────────────────────────────────────────── */}
      <div className="sidebar__header">
        <div className="sidebar__logo">
          <div className="sidebar__logo-icon" style={{ background: 'none', boxShadow: 'none', padding: 0 }}>
            <img src={logoImage} alt="Zorithm Logo" style={{ width: '100%', height: '100%', borderRadius: '8px', objectFit: 'cover' }} />
          </div>
          <div>
            <span className="sidebar__logo-title">Zorithm</span>
            <span className="sidebar__logo-sub">AI Algorithm Assistant</span>
          </div>
        </div>
        <button className="sidebar__close-btn" onClick={onClose} aria-label="Close sidebar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      {/* ── New Chat Button ───────────────────────────────────── */}
      <div className="sidebar__new-chat-wrap">
        <button className="btn-new-chat" onClick={handleNewChat} id="new-chat-btn">
          <PlusIcon />
          <span>New Chat</span>
        </button>
      </div>

      {/* ── Chat History ──────────────────────────────────────── */}
      <div className="sidebar__section">
        <button
          className="sidebar__section-header"
          onClick={() => setHistoryOpen(v => !v)}
          aria-expanded={historyOpen}
        >
          <span>Chat History</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {sessions.length > 0 && (
              <span className="sidebar__badge">{sessions.length}</span>
            )}
            <ChevronIcon isOpen={historyOpen} />
          </div>
        </button>

        {historyOpen && (
          <div className="sidebar__history">
            {sessions.length === 0 ? (
              <div className="sidebar__empty">
                <MessageIcon />
                <p>No conversations yet</p>
                <span>Start a new chat to begin</span>
              </div>
            ) : (
              sessions.map(session => (
                <div
                  key={session.id}
                  className={`sidebar__session ${currentSessionId === session.id ? 'sidebar__session--active' : ''}`}
                  onMouseEnter={() => setHoveredSession(session.id)}
                  onMouseLeave={() => setHoveredSession(null)}
                  onClick={() => {
                    loadSession(session.id);
                    onClose?.();
                  }}
                >
                  <div className="sidebar__session-icon">
                    <MessageIcon />
                  </div>
                  <div className="sidebar__session-info">
                    <span className="sidebar__session-title">{truncate(session.title, 38)}</span>
                    <span className="sidebar__session-meta">{formatRelativeDate(session.lastMessage)}</span>
                  </div>
                  {hoveredSession === session.id && (
                    <button
                      className="sidebar__delete-btn"
                      onClick={(e) => handleDeleteSession(e, session.id)}
                      aria-label="Delete session"
                    >
                      <TrashIcon />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* ── Suggested Queries ─────────────────────────────────── */}
      {sessions.length === 0 && (
        <div className="sidebar__section sidebar__section--suggestions">
          <div className="sidebar__section-header sidebar__section-header--static">
            <span>Try asking about…</span>
          </div>
          <div className="sidebar__suggestions">
            {SUGGESTED_QUERIES.map((q) => (
              <button
                key={q}
                className="sidebar__suggestion"
                onClick={() => {
                  // dispatch click to input + send
                  window.dispatchEvent(new CustomEvent('algobot:suggest', { detail: q }))
                  onClose?.()
                }}
              >
                <span className="sidebar__suggestion-icon">⚡</span>
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Footer ───────────────────────────────────────────── */}
      <div className="sidebar__footer">
        <div className="sidebar__theme-row">
          <span className="sidebar__theme-label">
            {theme === 'dark' ? '🌙 Dark Mode' : '☀️ Light Mode'}
          </span>
          <button
            className={`theme-toggle ${theme === 'light' ? 'theme-toggle--light' : ''}`}
            onClick={onThemeToggle}
            aria-label="Toggle theme"
            id="theme-toggle-btn"
          >
            <span className="theme-toggle__thumb" />
          </button>
        </div>
        <p className="sidebar__footer-credit">Powered by Gemini 1.5 Flash</p>
      </div>
    </aside>
  )
}

import './Navbar.css'

const MenuIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="3" y1="6" x2="21" y2="6"/>
    <line x1="3" y1="12" x2="21" y2="12"/>
    <line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
)

const FlashIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
  </svg>
)

export default function Navbar({ onMenuToggle, messageCount, children }) {
  return (
    <nav className="navbar" aria-label="Main navigation">
      <div className="navbar__left">
        <button id="menu-toggle-btn" className="navbar__menu-btn" onClick={onMenuToggle} aria-label="Toggle sidebar">
          <MenuIcon />
        </button>
        <div className="navbar__title-group">
          <h1 className="navbar__title">Algorithm Assistant</h1>
          {messageCount > 0 && (
            <span className="navbar__msg-count">{messageCount} msgs</span>
          )}
        </div>
      </div>

      <div className="navbar__right">
        {children}
        <div className="navbar__model-badge">
          <FlashIcon />
          <span>Gemini 2.5 Flash</span>
        </div>
        <div className="navbar__status">
          <span className="navbar__status-dot"></span>
          <span>Online</span>
        </div>
      </div>
    </nav>
  )
}

import { useChat } from '../ChatContext'
import './ModeSelector.css'

const MODES = [
  { id: 'Explain', label: 'Explain Mode', icon: '🧠' },
  { id: 'Code', label: 'Practice Mode', icon: '💻' },
  { id: 'DryRun', label: 'Dry Run Mode', icon: '🔍' },
  { id: 'Interview', label: 'Interview Mode', icon: '🎙️' },
]

export default function ModeSelector() {
  const { activeMode, setActiveMode, isLoading } = useChat()

  return (
    <div className="mode-selector">
      {MODES.map(mode => (
        <button
          key={mode.id}
          className={`mode-btn ${activeMode === mode.id ? 'mode-btn--active' : ''}`}
          onClick={() => setActiveMode(mode.id)}
          disabled={isLoading}
          aria-pressed={activeMode === mode.id}
        >
          <span className="mode-icon">{mode.icon}</span>
          <span className="mode-label">{mode.label}</span>
        </button>
      ))}
    </div>
  )
}

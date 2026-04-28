import { useChat } from '../ChatContext'
import './ModeSelector.css' // We can reuse the mode selector CSS

export default function ModelSelector() {
  const { activeModel, setActiveModel, isLoading } = useChat()

  return (
    <div className="mode-selector" style={{ background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '24px', display: 'flex', gap: '4px', border: '1px solid rgba(255,255,255,0.1)' }}>
      <button
        className={`mode-btn ${activeModel === 'qwen' ? 'mode-btn--active' : ''}`}
        onClick={() => setActiveModel('qwen')}
        disabled={isLoading}
        style={{ margin: 0, padding: '0.4rem 1rem', flex: 1, justifyContent: 'center' }}
      >
        Qwen
      </button>
      <button
        className={`mode-btn ${activeModel === 'gemini' ? 'mode-btn--active' : ''}`}
        onClick={() => setActiveModel('gemini')}
        disabled={isLoading}
        style={{ margin: 0, padding: '0.4rem 1rem', flex: 1, justifyContent: 'center' }}
      >
        Gemini
      </button>
    </div>
  )
}

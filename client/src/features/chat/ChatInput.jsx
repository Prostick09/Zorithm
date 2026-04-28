import { useState, useEffect, useRef } from 'react'
import { useChat } from './ChatContext'
import './ChatInput.css'

const SendIcon = ({ isLoading }) => isLoading ? (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
    <path d="M12 2a10 10 0 1 0 10 10" strokeLinecap="round"/>
  </svg>
) : (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="22" y1="2" x2="11" y2="13"/>
    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
)

const QUICK_PROMPTS = [
  { label: '⚡ Quicksort', prompt: 'Explain Quicksort algorithm with time complexity analysis' },
  { label: '🔍 Binary Search', prompt: 'Analyze Binary Search algorithm — intuition and complexity' },
  { label: '🌐 BFS vs DFS', prompt: 'Compare BFS and DFS graph traversal algorithms' },
  { label: '🔢 DP Intro', prompt: 'Explain Dynamic Programming with a classic example' },
  { label: '🌳 AVL Trees', prompt: 'How do AVL trees maintain balance and what is the complexity?' },
]

import ModeSelector from './components/ModeSelector'
import ModelSelector from './components/ModelSelector'

export default function ChatInput() {
  const { sendMessage, isLoading } = useChat()
  const [input, setInput] = useState('')
  const textareaRef = useRef(null)
  const [showQuickPrompts, setShowQuickPrompts] = useState(true)

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current
    if (ta) {
      ta.style.height = 'auto'
      ta.style.height = Math.min(ta.scrollHeight, 160) + 'px'
    }
  }, [input])

  // Listen for sidebar suggestion click
  useEffect(() => {
    const handler = (e) => {
      setInput(e.detail)
      textareaRef.current?.focus()
    }
    window.addEventListener('algobot:suggest', handler)
    return () => window.removeEventListener('algobot:suggest', handler)
  }, [])

  const handleSubmit = (e) => {
    e?.preventDefault()
    if (!input.trim() || isLoading) return
    sendMessage(input.trim())
    setInput('')
    setShowQuickPrompts(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleQuickPrompt = (prompt) => {
    sendMessage(prompt)
    setShowQuickPrompts(false)
  }

  return (
    <div className="chat-input-container">
      <div style={{ display: 'flex', gap: '10px' }}>
        <ModeSelector />
        <ModelSelector />
      </div>
      {/* Quick Prompts */}
      {showQuickPrompts && !isLoading && (
        <div className="quick-prompts">
          {QUICK_PROMPTS.map(({ label, prompt }) => (
            <button
              key={label}
              className="quick-prompt-btn"
              onClick={() => handleQuickPrompt(prompt)}
              id={`quick-${label.replace(/\W/g, '-')}`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Input Form */}
      <form className="chat-input-form" onSubmit={handleSubmit} id="chat-form">
        <div className="chat-input-wrap">
          <textarea
            ref={textareaRef}
            id="chat-message-input"
            className="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about any algorithm, data structure, or complexity…"
            rows={1}
            disabled={isLoading}
            aria-label="Message input"
            autoComplete="off"
          />
          <button
            id="send-message-btn"
            type="submit"
            className={`chat-send-btn ${input.trim() && !isLoading ? 'chat-send-btn--active' : ''}`}
            disabled={!input.trim() || isLoading}
            aria-label="Send message"
          >
            <SendIcon isLoading={isLoading} />
          </button>
        </div>
        <p className="chat-input-hint">
          Press <kbd>Enter</kbd> to send · <kbd>Shift+Enter</kbd> for newline
        </p>
      </form>
    </div>
  )
}

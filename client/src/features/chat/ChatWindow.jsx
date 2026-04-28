import { useEffect, useRef } from 'react'
import { useChat } from './ChatContext'
import MessageBubble, { TypingIndicator } from './MessageBubble'
import ChatInput from './ChatInput'
import './ChatWindow.css'
import logoImage from '../../assets/logo.jpeg'

const EmptyState = () => (
  <div className="chat-empty">
    <div className="chat-empty__icon" style={{ background: 'none', boxShadow: 'none', padding: 0 }}>
      <img src={logoImage} alt="Zorithm Logo" style={{ width: '100%', height: '100%', borderRadius: '16px', objectFit: 'cover' }} />
    </div>
    <h2 className="chat-empty__title">Welcome to Zorithm</h2>
    <p className="chat-empty__sub">
      Your AI-powered algorithm analysis assistant.<br/>
      Ask about any algorithm, data structure, or complexity problem.
    </p>
    <div className="chat-empty__features">
      {[
        { emoji: '🎯', text: 'Step-by-step algorithm approach' },
        { emoji: '⏱️', text: 'Time & space complexity analysis' },
        { emoji: '💻', text: 'Working code implementations' },
        { emoji: '💡', text: 'Intuition & key insights' },
      ].map(({ emoji, text }) => (
        <div key={text} className="chat-empty__feature">
          <span>{emoji}</span>
          <span>{text}</span>
        </div>
      ))}
    </div>
  </div>
)

export default function ChatWindow() {
  const { messages, isLoading } = useChat()
  const bottomRef = useRef(null)
  const scrollRef = useRef(null)

  // Auto-scroll to bottom only when a new message is added or loading state changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, isLoading])

  return (
    <div className="chat-window">
      {/* Message Thread */}
      <div className="chat-thread" ref={scrollRef} id="chat-thread">
        {messages.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="chat-messages">
            {messages.map(msg => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {isLoading && <TypingIndicator />}
            <div ref={bottomRef} style={{ height: 8 }} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <ChatInput />
    </div>
  )
}

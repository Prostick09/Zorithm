import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { getComplexityColor, formatTime } from '../../shared/utils/helpers'
import { useChat } from './ChatContext'
import './MessageBubble.css'

/* ── Complexity Badge ─────────────────────────────────── */
const ComplexityBadge = ({ label, value }) => {
  const color = getComplexityColor(value)
  return (
    <div className={`complexity-badge complexity-badge--${color}`}>
      <span className="complexity-badge__label">{label}</span>
      <code className="complexity-badge__value">{value}</code>
    </div>
  )
}

/* ── Copy Button ──────────────────────────────────────── */
const CopyButton = ({ text }) => {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
    } catch { /* ignore */ }
  }
  return (
    <button className="copy-btn" onClick={handleCopy} title="Copy code" aria-label="Copy code">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <rect x="9" y="9" width="13" height="13" rx="2"/>
        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
      </svg>
    </button>
  )
}

/* ── Bot Response Card ────────────────────────────────── */
const BotResponseCard = ({ content, onRetry }) => {
  if (typeof content === 'string') {
    return (
      <div className="bot-message__fallback">
        <p>{content}</p>
      </div>
    )
  }

  const {
    title, approach, intuition, algorithm, dryRunSteps,
    timeComplexity, spaceComplexity,
    codeExample, keyInsights, useCases, difficulty, comparisons
  } = content

  const difficultyColor = {
    Easy: 'green', Medium: 'yellow', Hard: 'red'
  }[difficulty] || 'purple'

  return (
    <div className="bot-card">
      {/* Title + Difficulty */}
      {title && (
        <div className="bot-card__title-row animate-stagger" style={{ '--stagger': 1 }}>
          <h2 className="bot-card__title">{title}</h2>
          {difficulty && (
            <span className={`bot-card__difficulty bot-card__difficulty--${difficultyColor}`}>
              {difficulty}
            </span>
          )}
        </div>
      )}

      {/* Approach */}
      {approach && (
        <section className="bot-card__section animate-stagger" style={{ '--stagger': 2 }}>
          <div className="bot-card__section-header">
            <span className="bot-card__section-emoji">🎯</span>
            <h3>Approach</h3>
          </div>
          <div className="bot-card__text markdown-body">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{approach}</ReactMarkdown>
          </div>
        </section>
      )}

      {/* Intuition */}
      {intuition && (
        <section className="bot-card__section animate-stagger" style={{ '--stagger': 3 }}>
          <div className="bot-card__section-header">
            <span className="bot-card__section-emoji">💡</span>
            <h3>Intuition</h3>
          </div>
          <div className="bot-card__text markdown-body">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{intuition}</ReactMarkdown>
          </div>
        </section>
      )}

      {/* Algorithm Steps */}
      {algorithm && (
        <section className="bot-card__section animate-stagger" style={{ '--stagger': 4 }}>
          <div className="bot-card__section-header">
            <span className="bot-card__section-emoji">📋</span>
            <h3>Algorithm</h3>
          </div>
          <div className="bot-card__text markdown-body">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{algorithm}</ReactMarkdown>
          </div>
        </section>
      )}

      {/* Dry Run Steps (For DryRun Mode) */}
      {dryRunSteps && dryRunSteps.length > 0 && (
        <section className="bot-card__section animate-stagger" style={{ '--stagger': 4 }}>
          <div className="bot-card__section-header">
            <span className="bot-card__section-emoji">🔄</span>
            <h3>Dry Run Trace</h3>
          </div>
          <div className="dry-run-container">
            {dryRunSteps.map((step, idx) => (
              <div key={idx} className="dry-run-card" style={{ 
                background: 'var(--bg-sidebar)', 
                border: '1px solid var(--border)', 
                borderRadius: '8px', 
                padding: '12px', 
                marginBottom: '10px' 
              }}>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '13px', color: 'var(--primary)' }}>{step.step || `Step ${idx + 1}`}</h4>
                {step.action && <p className="bot-card__text" style={{ marginBottom: '6px' }}><strong>Action:</strong> {step.action}</p>}
                {step.state && <code style={{ display: 'block', padding: '6px', background: 'var(--bg-dark)', borderRadius: '4px', fontSize: '12px' }}>{step.state}</code>}
              </div>
            ))}
          </div>
        </section>
      )}
      {/* Complexity */}
      {(timeComplexity || spaceComplexity) && (
        <section className="bot-card__section animate-stagger" style={{ '--stagger': 5 }}>
          <div className="bot-card__section-header">
            <span className="bot-card__section-emoji">⏱️</span>
            <h3>Complexity Analysis</h3>
          </div>
          <div className="complexity-grid">
            {timeComplexity && (
              <>
                <ComplexityBadge label="Best" value={timeComplexity.best} />
                <ComplexityBadge label="Average" value={timeComplexity.average} />
                <ComplexityBadge label="Worst" value={timeComplexity.worst} />
              </>
            )}
            {spaceComplexity && (
              <ComplexityBadge label="Space" value={spaceComplexity.complexity} />
            )}
          </div>
          {timeComplexity?.explanation && (
            <div className="bot-card__text bot-card__text--small markdown-body">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{timeComplexity.explanation}</ReactMarkdown>
            </div>
          )}
        </section>
      )}

      {/* Code Example */}
      {codeExample?.code && (
        <section className="bot-card__section animate-stagger" style={{ '--stagger': 6 }}>
          <div className="bot-card__section-header">
            <span className="bot-card__section-emoji">💻</span>
            <h3>Implementation</h3>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="bot-card__lang-tag">{codeExample.language || 'python'}</span>
              <CopyButton text={codeExample.code} />
            </div>
          </div>
          <div className="bot-card__code-wrap">
            <SyntaxHighlighter
              language={codeExample.language || 'python'}
              style={vscDarkPlus}
              customStyle={{
                margin: 0,
                borderRadius: '8px',
                fontSize: '0.78rem',
                background: '#0A0A18',
                border: '1px solid rgba(108,99,255,0.15)',
              }}
              showLineNumbers
            >
              {codeExample.code}
            </SyntaxHighlighter>
          </div>
        </section>
      )}

      {/* Key Insights */}
      {keyInsights && keyInsights.length > 0 && (
        <section className="bot-card__section animate-stagger" style={{ '--stagger': 7 }}>
          <div className="bot-card__section-header">
            <span className="bot-card__section-emoji">🔑</span>
            <h3>Key Insights</h3>
          </div>
          <ul className="bot-card__list">
            {keyInsights.map((insight, i) => (
              <li key={i} className="bot-card__list-item">
                <span className="bot-card__list-dot" />
                {insight}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Use Cases */}
      {useCases && useCases.length > 0 && (
        <section className="bot-card__section animate-stagger" style={{ '--stagger': 8 }}>
          <div className="bot-card__section-header">
            <span className="bot-card__section-emoji">🚀</span>
            <h3>Use Cases</h3>
          </div>
          <div className="bot-card__tags">
            {useCases.map((uc, i) => (
              <span key={i} className="bot-card__tag">{uc}</span>
            ))}
          </div>
        </section>
      )}

      {/* Comparisons */}
      {comparisons && (
        <section className="bot-card__section animate-stagger" style={{ '--stagger': 9 }}>
          <div className="bot-card__section-header">
            <span className="bot-card__section-emoji">⚖️</span>
            <h3>Comparisons</h3>
          </div>
          <div className="bot-card__text markdown-body">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{comparisons}</ReactMarkdown>
          </div>
        </section>
      )}

      {/* Retry Button for Fallback Responses */}
      {content.isFallback && (
        <div className="bot-card__retry-bar">
          <span className="bot-card__retry-text">⚠️ This is a fallback response</span>
          <button className="bot-card__retry-btn" onClick={onRetry}>
            🔄 Retry
          </button>
        </div>
      )}
    </div>
  )
}

/* ── Typing Indicator ─────────────────────────────────── */
export const TypingIndicator = ({ modelName = 'Zorithm' }) => (
  <div className="message message--bot" style={{ animation: 'slideInLeft 0.2s ease' }}>
    <div className="message__avatar message__avatar--bot">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="11" width="18" height="10" rx="2"/>
        <circle cx="12" cy="5" r="2"/>
        <path d="M12 7v4"/>
      </svg>
    </div>
    <div className="typing-indicator">
      <span className="typing-indicator__dot" style={{ animationDelay: '0ms' }} />
      <span className="typing-indicator__dot" style={{ animationDelay: '180ms' }} />
      <span className="typing-indicator__dot" style={{ animationDelay: '360ms' }} />
      <span className="typing-indicator__text">{modelName} is thinking…</span>
    </div>
  </div>
)

/* ── Error Bubble ─────────────────────────────────────── */
const ErrorBubble = ({ content, onRetry }) => (
  <div className="message message--error">
    <div className="error-bubble">
      <span className="error-bubble__icon">⚠️</span>
      <div>
        <p className="error-bubble__title">Error</p>
        <p className="error-bubble__text">{content}</p>
        {onRetry && (
          <button className="bot-card__retry-btn" onClick={onRetry} style={{ marginTop: '8px' }}>
            🔄 Retry
          </button>
        )}
      </div>
    </div>
  </div>
)

/* ── Main Message Bubble ──────────────────────────────── */
export default function MessageBubble({ message }) {
  const { role, content, timestamp } = message
  const { sendMessage } = useChat()

  if (role === 'error') return <ErrorBubble content={content} onRetry={message._retryPrompt ? () => sendMessage(message._retryPrompt) : null} />

  if (role === 'user') {
    return (
      <div className="message message--user">
        <div className="message__content-wrap message__content-wrap--user">
          <div className="user-bubble">
            <p className="user-bubble__text">{content}</p>
          </div>
          {timestamp && (
            <span className="message__timestamp">{formatTime(timestamp)}</span>
          )}
        </div>
        <div className="message__avatar message__avatar--user">U</div>
      </div>
    )
  }

  return (
    <div className="message message--bot">
      <div className="message__avatar message__avatar--bot">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="11" width="18" height="10" rx="2"/>
          <circle cx="12" cy="5" r="2"/>
          <path d="M12 7v4"/>
        </svg>
      </div>
      <div className="message__content-wrap message__content-wrap--bot">
        {message.structured ? (
          <BotResponseCard content={message.structured} onRetry={message._retryPrompt ? () => sendMessage(message._retryPrompt) : null} />
        ) : (
          <div className="bot-message__fallback markdown-body">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({node, inline, className, children, ...props}) {
                  const match = /language-(\w+)/.exec(className || '')
                  return !inline && match ? (
                    <SyntaxHighlighter
                      style={vscDarkPlus}
                      language={match[1]}
                      PreTag="div"
                      customStyle={{
                        margin: 0,
                        borderRadius: '8px',
                        fontSize: '0.78rem',
                        background: '#0A0A18',
                        border: '1px solid rgba(108,99,255,0.15)'
                      }}
                      {...props}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  )
                }
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        )}
        {timestamp && (
          <span className="message__timestamp">{formatTime(timestamp)}</span>
        )}
      </div>
    </div>
  )
}

import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'
import { createSession, sendMessage as apiSendMessage } from './chatApi'
import { historyApi } from '../history/historyApi'
import { generateLocalId } from '../../shared/utils/helpers'

const ChatContext = createContext(null)

export const ChatProvider = ({ children }) => {
  const [activeMode, setActiveMode] = useState('Explain')
  const [activeModel, setActiveModel] = useState('qwen')
  const [activeVisualization, setActiveVisualization] = useState(null)
  const [sessions, setSessions] = useState([]) // sidebar history
  const [currentSessionId, setCurrentSessionId] = useState(null)
  const [messages, setMessages] = useState([]) // current conversation
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const sessionIdRef = useRef(null)

  const startNewChat = useCallback(async () => {
    setMessages([])
    setCurrentSessionId(null)
    setActiveVisualization(null)
    sessionIdRef.current = null
    setError(null)
  }, [])

  const loadSession = useCallback(async (sessionId) => {
    try {
      setIsLoading(true)
      const sessionData = await historyApi.getSessionDetails(sessionId)
      if (sessionData && sessionData.messages) {
        setMessages(sessionData.messages)
        setCurrentSessionId(sessionId)
        sessionIdRef.current = sessionId
        setActiveVisualization(null) // reset visualizer on historical load
      }
    } catch (err) {
      setError('Failed to load history context')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    historyApi.getSessions()
      .then(data => {
        // map backend keys to frontend keys if needed
        const mappedSessions = data.map(s => ({
          id: s.sessionId,
          title: s.title,
          lastMessage: s.updatedAt
        }))
        setSessions(mappedSessions)
      })
      .catch(err => console.error("Could not load history", err))
  }, [])

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || isLoading) return

    setError(null)

    // Add user message immediately (optimistic)
    const userMsg = {
      id: generateLocalId(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    }
    setMessages(prev => [...prev, userMsg])
    setIsLoading(true)

    try {
      // Create session on first message
      let sessionId = sessionIdRef.current
      if (!sessionId) {
        sessionId = await createSession()
        sessionIdRef.current = sessionId
        setCurrentSessionId(sessionId)
      }

      const botMsgId = generateLocalId()
      const botMsgTemplate = {
        id: botMsgId,
        role: 'assistant',
        content: '',
        structured: null,
        timestamp: new Date().toISOString(),
      }

      const result = await apiSendMessage(text, sessionId, activeMode, activeModel, (chunk) => {
        setIsLoading(false) // Hide the typing indicator once streaming starts
        setMessages(prev => {
          const exists = prev.find(m => m.id === botMsgId)
          if (exists) {
            return prev.map(m => 
              m.id === botMsgId ? { ...m, content: m.content + chunk } : m
            )
          } else {
            return [...prev, { ...botMsgTemplate, content: chunk }]
          }
        })
      })
      
      if (result.response?.visualizationId || result.structured?.visualizationId) {
        setActiveVisualization(result.response?.visualizationId || result.structured?.visualizationId)
      }

      const finalBotMsg = {
        id: result.messageId || botMsgId,
        role: 'assistant',
        content: result.content || result.response,
        structured: result.structured || null,
        _retryPrompt: result.structured?.isFallback ? text : null,
        timestamp: new Date().toISOString(),
      }
      
      setMessages(prev => {
        const exists = prev.find(m => m.id === botMsgId)
        if (exists) {
          return prev.map(m => m.id === botMsgId ? finalBotMsg : m)
        } else {
          return [...prev, finalBotMsg]
        }
      })

      // Update sidebar sessions
      setSessions(prev => {
        const existing = prev.find(s => s.id === sessionId)
        const sessionTitle = text.length > 55 ? text.substring(0, 55) + '…' : text
        if (existing) {
          return prev.map(s =>
            s.id === sessionId
              ? { ...s, messageCount: (s.messageCount || 0) + 2, lastMessage: finalBotMsg.timestamp }
              : s
          )
        }
        return [
          { id: sessionId, title: sessionTitle, messageCount: 2, lastMessage: finalBotMsg.timestamp, createdAt: new Date().toISOString() },
          ...prev,
        ]
      })
    } catch (err) {
      setError(err.message)
      setMessages(prev => [
        ...prev,
        {
          id: generateLocalId(),
          role: 'error',
          content: err.message,
          _retryPrompt: text,
          timestamp: new Date().toISOString(),
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, activeMode, activeModel])

  const removeSession = useCallback(async (sessionId) => {
    try {
      await historyApi.deleteSession(sessionId)
      setSessions(prev => prev.filter(s => s.id !== sessionId))
      if (sessionIdRef.current === sessionId) {
        startNewChat()
      }
    } catch {
      // Silently ignore delete errors
    }
  }, [startNewChat])

  return (
    <ChatContext.Provider value={{
      sessions,
      currentSessionId,
      messages,
      isLoading,
      error,
      activeMode,
      activeModel,
      activeVisualization,
      sendMessage,
      setActiveMode,
      setActiveModel,
      startNewChat,
      removeSession,
      loadSession,
    }}>
      {children}
    </ChatContext.Provider>
  )
}

export const useChat = () => {
  const ctx = useContext(ChatContext)
  if (!ctx) throw new Error('useChat must be used within ChatProvider')
  return ctx
}

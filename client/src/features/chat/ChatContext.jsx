import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'
import { createSession, sendMessage as apiSendMessage, deleteSession } from './chatApi'
import { historyApi } from '../history/historyApi'
import { generateLocalId } from '../../shared/utils/helpers'

const ChatContext = createContext(null)

export const ChatProvider = ({ children }) => {
  const [activeMode, setActiveMode] = useState('Explain')
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

      const result = await apiSendMessage(text, sessionId, activeMode)
      
      if (result.response?.visualizationId) {
        setActiveVisualization(result.response.visualizationId)
      }

      const botMsg = {
        id: result.messageId || generateLocalId(),
        role: 'assistant',
        content: result.response,
        timestamp: new Date().toISOString(),
      }
      setMessages(prev => [...prev, botMsg])

      // Update sidebar sessions
      setSessions(prev => {
        const existing = prev.find(s => s.id === sessionId)
        const sessionTitle = text.length > 55 ? text.substring(0, 55) + '…' : text
        if (existing) {
          return prev.map(s =>
            s.id === sessionId
              ? { ...s, messageCount: (s.messageCount || 0) + 2, lastMessage: botMsg.timestamp }
              : s
          )
        }
        return [
          { id: sessionId, title: sessionTitle, messageCount: 2, lastMessage: botMsg.timestamp, createdAt: new Date().toISOString() },
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
          timestamp: new Date().toISOString(),
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, activeMode])

  const removeSession = useCallback(async (sessionId) => {
    try {
      await deleteSession(sessionId)
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
      activeVisualization,
      sendMessage,
      setActiveMode,
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

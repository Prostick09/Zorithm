import api from '../../shared/api/apiClient'

/**
 * Create a new chat session on the backend
 */
export const createSession = async () => {
  const res = await api.post('/chat/session')
  return res.data.sessionId
}

/**
 * Send a message to the AI and get a structured response
 * @param {string} message
 * @param {string} sessionId
 * @param {string} mode
 */
export const sendMessage = async (message, sessionId, mode = 'Explain') => {
  const res = await api.post('/chat/message', { message, sessionId, mode })
  return res.data
}

/**
 * List all chat sessions
 */
export const listSessions = async () => {
  const res = await api.get('/chat/sessions')
  return res.data.sessions || []
}

/**
 * Get messages for a specific session
 */
export const getSession = async (sessionId) => {
  const res = await api.get(`/chat/session/${sessionId}`)
  return res.data
}

/**
 * Delete a chat session
 */
export const deleteSession = async (sessionId) => {
  await api.delete(`/chat/session/${sessionId}`)
}

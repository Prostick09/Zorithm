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
export const sendMessage = async (message, sessionId, mode = 'Explain', model = 'qwen', onChunk = null) => {
  const token = localStorage.getItem('token'); // get token if needed, or api handles it
  // Using native fetch to process SSE streams
  const response = await fetch('/api/chat/message', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ message, sessionId, mode, model })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || err.message || 'Failed to send message');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let done = false;
  let finalResult = null;
  let buffer = '';

  while (!done) {
    const { value, done: doneReading } = await reader.read();
    done = doneReading;
    if (value) {
      buffer += decoder.decode(value, { stream: true });
      let newlineIdx;
      while ((newlineIdx = buffer.indexOf('\n\n')) >= 0) {
        const line = buffer.slice(0, newlineIdx);
        buffer = buffer.slice(newlineIdx + 2);
        if (line.startsWith('data: ')) {
          let data;
          try {
            data = JSON.parse(line.slice(6));
          } catch (e) {
            continue; // Ignore parse errors on incomplete chunks
          }

          if (data.error) {
            throw new Error(data.error);
          } else if (data.chunk && onChunk) {
            onChunk(data.chunk);
          } else if (data.done) {
            finalResult = data.result;
          }
        }
      }
    }
  }
  
  return finalResult || {};
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

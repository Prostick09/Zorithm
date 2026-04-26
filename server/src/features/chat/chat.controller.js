const chatService = require('./chat.service');
const historyService = require('../history/history.service');
const { successResponse } = require('../../shared/utils/response.util');

/**
 * POST /api/chat/session - Create a new chat session
 */
const createSession = async (req, res, next) => {
  try {
    const sessionId = chatService.createSession();
    res.status(201).json(successResponse({ sessionId }, 'Chat session created'));
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/chat/message - Send a message to the AI
 */
const sendMessage = async (req, res, next) => {
  try {
    const { message, sessionId, mode } = req.body;

    const activeSessionId = sessionId || `session-${Date.now()}`;
    const result = await chatService.sendMessage(message, activeSessionId, mode || 'Explain');

    // Save persistent history using MongoDB
    try {
        await historyService.appendMessages(activeSessionId, result.title || 'New Chat', [
            { role: 'user', content: message, mode: mode || 'Explain' },
            { role: 'assistant', content: JSON.stringify(result), mode: mode || 'Explain' }
        ]);
    } catch (dbError) {
        console.error('Failed to save to history DB:', dbError);
        // We don't fail the chat API request if DB saving fails
    }

    res.status(200).json(successResponse(result, 'Message processed successfully'));
  } catch (error) {
    // Provide a helpful error if API key is missing
    if (error.message && error.message.includes('AIzaSyChDx4hTrtK_T-hmyDei9AKvDjMKC5Brv4')) {
      error.status = 503;
      error.message = 'Gemini API key not configured. Please set GEMINI_API_KEY in server/.env';
    }
    next(error);
  }
};

/**
 * GET /api/chat/session/:sessionId - Get session details
 */
const getSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const session = chatService.getSession(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: { message: 'Session not found', status: 404 },
      });
    }

    res.status(200).json(successResponse(session));
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/chat/sessions - List all sessions
 */
const listSessions = async (req, res, next) => {
  try {
    const sessions = chatService.listSessions();
    res.status(200).json(successResponse({ sessions, total: sessions.length }));
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/chat/session/:sessionId - Delete a session
 */
const deleteSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const deleted = chatService.deleteSession(sessionId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: { message: 'Session not found', status: 404 },
      });
    }

    res.status(200).json(successResponse({ sessionId }, 'Session deleted successfully'));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSession,
  sendMessage,
  getSession,
  listSessions,
  deleteSession,
};

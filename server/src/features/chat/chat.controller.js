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
    const { message, sessionId, mode, model } = req.body;

    console.log("Model selected:", model);

    const activeSessionId = sessionId || `session-${Date.now()}`;

    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const result = await chatService.sendMessage(
      message, 
      activeSessionId, 
      mode || 'Explain', 
      model || 'qwen',
      (chunk) => {
        res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
      }
    );

    // Save persistent history using MongoDB
    try {
        const title = result.structured?.title || message.substring(0, 50);
        await historyService.appendMessages(activeSessionId, title, [
            { role: 'user', content: message, mode: mode || 'Explain' },
            { role: 'assistant', content: result.content, structured: result.structured, mode: mode || 'Explain' }
        ]);
    } catch (dbError) {
        console.error('Failed to save to history DB:', dbError);
        // We don't fail the chat API request if DB saving fails
    }

    res.write(`data: ${JSON.stringify({ done: true, result })}\n\n`);
    res.end();
  } catch (error) {
    console.error('Fatal Chat Controller Error:', error.message);
    
    const fallbackResult = {
      role: 'assistant',
      content: "A helpful fallback explanation based on the user query. (System operates in fallback mode due to AI service unavailability)",
      structured: {
        title: "System Fallback Response",
        approach: "Explanation that AI services are temporarily unavailable.",
        keyInsights: ["Graceful degradation", "System reliability maintained"],
        note: "This is a system-generated fallback response"
      }
    };

    if (!res.headersSent) {
      // If we haven't even started SSE, we can just send it as a standard response or start SSE
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();
    }
    
    res.write(`data: ${JSON.stringify({ chunk: fallbackResult.content })}\n\n`);
    res.write(`data: ${JSON.stringify({ done: true, result: fallbackResult })}\n\n`);
    res.end();
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

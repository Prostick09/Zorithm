const express = require('express');
const router = express.Router();
const chatController = require('./chat.controller');
const { validateChatRequest } = require('../../shared/middleware/validation.middleware');

// POST /api/chat/session - Create new session
router.post('/session', chatController.createSession);

// POST /api/chat/message - Send a message (validated)
router.post('/message', validateChatRequest, chatController.sendMessage);

// GET /api/chat/sessions - List all sessions
router.get('/sessions', chatController.listSessions);

// GET /api/chat/session/:sessionId - Get a specific session
router.get('/session/:sessionId', chatController.getSession);

// DELETE /api/chat/session/:sessionId - Delete a session
router.delete('/session/:sessionId', chatController.deleteSession);

module.exports = router;

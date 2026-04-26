const express = require('express');
const router = express.Router();
const historyController = require('./history.controller');

/**
 * GET /api/history - Get all chat sessions
 */
router.get('/', historyController.getAllSessions);

/**
 * GET /api/history/:sessionId - Get full history of a session
 */
router.get('/:sessionId', historyController.getSessionById);

/**
 * POST /api/history/save - Save messages to history
 */
router.post('/save', historyController.saveSessionMessages);

module.exports = router;

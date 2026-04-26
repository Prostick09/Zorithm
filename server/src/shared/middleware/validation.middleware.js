/**
 * Validates the request body for the /api/chat/message endpoint.
 */
const validateChatRequest = (req, res, next) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({
      success: false,
      error: { message: 'Message is required', status: 400 },
    });
  }

  if (typeof message !== 'string') {
    return res.status(400).json({
      success: false,
      error: { message: 'Message must be a string', status: 400 },
    });
  }

  if (message.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: { message: 'Message cannot be empty', status: 400 },
    });
  }

  if (message.length > 5000) {
    return res.status(400).json({
      success: false,
      error: { message: 'Message too long (max 5000 characters)', status: 400 },
    });
  }

  next();
};

module.exports = { validateChatRequest };

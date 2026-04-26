const History = require('./history.model');

/**
 * Get all chat sessions sorted by latest
 */
exports.getAllSessions = async () => {
  return await History.find({}).sort({ updatedAt: -1 }).select('sessionId title updatedAt');
};

/**
 * Get full session details by ID
 */
exports.getSessionById = async (sessionId) => {
  return await History.findOne({ sessionId });
};

/**
 * Append messages to a session (creates if not exists)
 */
exports.appendMessages = async (sessionId, title, newMessages) => {
  const session = await History.findOne({ sessionId });
  
  if (session) {
    session.messages.push(...newMessages);
    // Update title only if provided and session currently has default title
    if (title && session.title === 'New Chat') {
        session.title = title;
    }
    await session.save();
    return session;
  } else {
    // Create new session
    const newSession = await History.create({
      sessionId,
      title: title || 'New Chat',
      messages: newMessages
    });
    return newSession;
  }
};

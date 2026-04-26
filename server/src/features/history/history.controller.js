const historyService = require('./history.service');

exports.getAllSessions = async (req, res, next) => {
  try {
    const sessions = await historyService.getAllSessions();
    res.json({
        success: true,
        data: sessions
    });
  } catch (error) {
    next(error);
  }
};

exports.getSessionById = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const session = await historyService.getSessionById(sessionId);
    if (!session) {
        return res.status(404).json({ success: false, error: 'Session not found' });
    }
    res.json({
        success: true,
        data: session
    });
  } catch (error) {
    next(error);
  }
};

exports.saveSessionMessages = async (req, res, next) => {
    try {
        const { sessionId, title, messages } = req.body;
        if (!sessionId || !messages || !Array.isArray(messages)) {
            return res.status(400).json({ success: false, error: 'Invalid payload requires sessionId and messages array' });
        }
        const session = await historyService.appendMessages(sessionId, title, messages);
        res.json({
            success: true,
            data: session
        });
    } catch (error) {
        next(error);
    }
}

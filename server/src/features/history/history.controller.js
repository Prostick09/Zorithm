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
    let session = await historyService.getSessionById(sessionId);
    if (!session) {
        return res.status(404).json({ success: false, error: 'Session not found' });
    }
    
    // Sanitize and fix legacy data on the fly
    const cleanedSession = session.toObject();
    if (cleanedSession.messages && Array.isArray(cleanedSession.messages)) {
        cleanedSession.messages = cleanedSession.messages.map(msg => {
            if (msg.role === 'assistant' && !msg.structured && typeof msg.content === 'string') {
                try {
                    // Try to parse legacy stringified JSON
                    const parsed = JSON.parse(msg.content);
                    if (parsed && typeof parsed === 'object') {
                        msg.structured = parsed;
                        
                        // Generate plain text fallback
                        let fallback = '';
                        if (parsed.title) fallback += `## ${parsed.title}\n\n`;
                        if (parsed.approach) fallback += `**Approach:**\n${parsed.approach}\n\n`;
                        if (parsed.intuition) fallback += `**Intuition:**\n${parsed.intuition}\n\n`;
                        if (parsed.algorithm) fallback += `**Algorithm:**\n${parsed.algorithm}\n\n`;
                        if (parsed.timeComplexity) {
                            fallback += `**Complexity:**\n- Best: ${parsed.timeComplexity.best}\n- Average: ${parsed.timeComplexity.average}\n- Worst: ${parsed.timeComplexity.worst}\n\n`;
                        }
                        if (parsed.codeExample && parsed.codeExample.code) {
                            fallback += `**Implementation:**\n\`\`\`${parsed.codeExample.language || 'text'}\n${parsed.codeExample.code}\n\`\`\`\n`;
                        }
                        msg.content = fallback.trim() || msg.content;
                    }
                } catch (e) {
                    // Not JSON, it's already plain text. Leave it alone.
                }
            }
            return msg;
        });
    }

    res.json({
        success: true,
        data: cleanedSession
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

exports.deleteSession = async (req, res, next) => {
    try {
        const { sessionId } = req.params;
        const result = await historyService.deleteSession(sessionId);
        if (!result) {
            return res.status(404).json({ success: false, error: 'Session not found' });
        }
        res.json({ success: true, data: { sessionId } });
    } catch (error) {
        next(error);
    }
}

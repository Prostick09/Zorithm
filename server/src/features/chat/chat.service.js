const { getModel } = require('../../shared/config/gemini.config');
const { generateId } = require('../../shared/utils/response.util');

// In-memory chat session storage (replace with DB in production)
const chatSessions = new Map();

/**
 * Builds the structured system prompt for algorithm analysis based on mode
 */
const buildSystemPrompt = (mode = 'Explain') => {
  let modeInstructions = '';
  let jsonSchema = '';

  if (mode === 'Code') {
    modeInstructions = 'You are a coding mentor interacting with a user in a Code Sandbox. If they ask for an algorithm, provide instructions and boilerplate code. If they submit an execution error or failure log, clearly explain their mistake, point out the issue, and suggest improvements rather than just giving the final answer.';
    jsonSchema = `{
  "title": "Practice Session",
  "approach": "Your guided feedback, problem instructions, or explanation of their code mistake.",
  "codeExample": {
    "language": "javascript",
    "code": "// Boilerplate or hinted code\\n..."
  },
  "visualizationId": "bubbleSort | selectionSort | insertionSort | null"
}`;
  } else if (mode === 'Interview') {
    modeInstructions = 'Act as a technical interviewer. DO NOT just give the answer or write code. Guide the user, ask follow-up questions, discuss edge cases, and ask about potential optimizations. Engage in a dialogue to test their knowledge.';
    jsonSchema = `{
  "title": "Algorithm/Concept Title",
  "approach": "Your interviewer dialogue. Ask a follow-up question, hint, or test their knowledge. DO NOT write out the full algorithm or provide the code snippet.",
  "visualizationId": "bubbleSort | selectionSort | insertionSort | null"
}`;
  } else if (mode === 'DryRun') {
    modeInstructions = 'Focus on providing stepwise execution logic. Keep track of specific data structure and variable values at every iteration step.';
    jsonSchema = `{
  "title": "Short descriptive title",
  "approach": "Brief description of the starting array/data structure",
  "dryRunSteps": [
    {
      "step": "Step 1",
      "action": "Description of the operation",
      "state": "Variables and array state (e.g. i=0, pivot=5, arr=[...])"
    }
  ],
  "codeExample": {
    "language": "python",
    "code": "# Python implementation\\n..."
  },
  "visualizationId": "bubbleSort | selectionSort | insertionSort | null"
}`;
  } else {
    modeInstructions = 'Emphasize deep intuition, visual analogies, and high-level structure to help the user learn effectively.';
    jsonSchema = `{
  "title": "Short descriptive title of the algorithm/concept",
  "approach": "Detailed explanation of the approach used to solve the problem (2-4 sentences)",
  "intuition": "The core intuition or insight behind the algorithm (2-3 sentences explaining WHY it works)",
  "algorithm": "Step-by-step algorithm description as numbered steps",
  "timeComplexity": {
    "best": "O(...)",
    "average": "O(...)",
    "worst": "O(...)",
    "explanation": "Brief explanation of why"
  },
  "spaceComplexity": {
    "complexity": "O(...)",
    "explanation": "Brief explanation"
  },
  "codeExample": {
    "language": "python",
    "code": "# Clean, commented Python implementation\\n..."
  },
  "keyInsights": ["Insight 1", "Insight 2", "Insight 3"],
  "useCases": ["Use case 1", "Use case 2"],
  "comparisons": "Optional: how this compares to alternative approaches",
  "difficulty": "Easy | Medium | Hard",
  "visualizationId": "bubbleSort | selectionSort | insertionSort | null"
}`;
  }

  return `
You are Zorithm, an expert algorithm and data structures assistant. Your role is to analyze algorithms, data structures, and computational problems with deep technical insight.

CURRENT MODE: ${mode} Mode
INSTRUCTIONS FOR CURRENT MODE: ${modeInstructions}

When a user asks about an algorithm or problem, always respond with a structured JSON object. ONLY include fields from the following schema. Omit any unlisted fields:

${jsonSchema}

Instructions:
- Always respond with valid JSON only. No markdown fences.
- Return "visualizationId" as exactly one of: "bubbleSort", "selectionSort", "insertionSort", or null if the algorithm is not matched.
- If the question is not about algorithms, respond with a helpful JSON note in the "approach" field.
`;
};

/**
 * Builds the user prompt with context
 * @param {string} message - User's message
 * @param {Array} conversationHistory - Previous messages for context
 */
const buildUserPrompt = (message, conversationHistory = []) => {
  let contextStr = '';
  if (conversationHistory.length > 0) {
    const recent = conversationHistory.slice(-4); // last 2 exchanges
    contextStr = `\n\nConversation context:\n${recent.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n')}\n`;
  }
  return `${contextStr}\nUser Question: ${message}`;
};

/**
 * Parses the Gemini response text into a structured object
 * @param {string} rawText - Raw text from Gemini
 */
const parseGeminiResponse = (rawText) => {
  try {
    // Extract everything from the first '{' to the last '}'
    const match = rawText.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error("No JSON object found");
    }
    return JSON.parse(match[0]);
  } catch (error) {
    console.error('Failed to parse Gemini response:', error.message);
    // Fallback structured response if JSON parsing fails
    return {
      title: 'Algorithm Analysis',
      approach: rawText,
      intuition: 'See the explanation above.',
      algorithm: 'See approach above.',
      timeComplexity: { best: 'N/A', average: 'N/A', worst: 'N/A', explanation: 'See response.' },
      spaceComplexity: { complexity: 'N/A', explanation: 'See response.' },
      codeExample: { language: 'text', code: '' },
      keyInsights: [],
      useCases: [],
      difficulty: 'Unknown',
    };
  }
};

/**
 * Sends a message to Gemini and returns a structured response
 * @param {string} message - User message
 * @param {string} sessionId - Chat session ID
 * @param {string} mode - The chat mode selected
 */
const sendMessage = async (message, sessionId, mode = 'Explain') => {
  const model = getModel('gemini-2.5-flash');

  // Get or create session history
  if (!chatSessions.has(sessionId)) {
    chatSessions.set(sessionId, {
      id: sessionId,
      createdAt: new Date().toISOString(),
      messages: [],
      title: null,
    });
  }

  const session = chatSessions.get(sessionId);
  const userMessageId = generateId();

  // Add user message to history
  session.messages.push({
    id: userMessageId,
    role: 'user',
    content: message,
    timestamp: new Date().toISOString(),
  });

  // Auto-title the session based on first message
  if (!session.title) {
    session.title = message.length > 60 ? message.substring(0, 60) + '...' : message;
  }

  // Build prompts
  const systemPrompt = buildSystemPrompt(mode);
  const userPrompt = buildUserPrompt(message, session.messages.slice(0, -1));
  const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;

  // Call Gemini API
  const result = await model.generateContent(fullPrompt);
  const rawText = result.response.text();

  // Parse structured response
  const parsed = parseGeminiResponse(rawText);

  // Generate unique IDs for complexity badges
  const botMessageId = generateId();
  const botMessage = {
    id: botMessageId,
    role: 'assistant',
    content: parsed,
    rawContent: rawText,
    timestamp: new Date().toISOString(),
  };

  // Store bot message
  session.messages.push({
    id: botMessageId,
    role: 'assistant',
    content: parsed.approach || rawText,
    timestamp: new Date().toISOString(),
  });

  chatSessions.set(sessionId, session);

  return {
    messageId: botMessageId,
    sessionId,
    response: parsed,
    conversationLength: session.messages.length,
  };
};

/**
 * Retrieves a chat session
 * @param {string} sessionId 
 */
const getSession = (sessionId) => {
  return chatSessions.get(sessionId) || null;
};

/**
 * Lists all sessions (summarized)
 */
const listSessions = () => {
  const sessions = [];
  chatSessions.forEach((session) => {
    sessions.push({
      id: session.id,
      title: session.title || 'New Chat',
      createdAt: session.createdAt,
      messageCount: session.messages.length,
      lastMessage: session.messages[session.messages.length - 1]?.timestamp || session.createdAt,
    });
  });
  return sessions.sort((a, b) => new Date(b.lastMessage) - new Date(a.lastMessage));
};

/**
 * Deletes a chat session
 * @param {string} sessionId 
 */
const deleteSession = (sessionId) => {
  return chatSessions.delete(sessionId);
};

/**
 * Creates a new empty session
 */
const createSession = () => {
  const sessionId = generateId();
  chatSessions.set(sessionId, {
    id: sessionId,
    createdAt: new Date().toISOString(),
    messages: [],
    title: null,
  });
  return sessionId;
};

module.exports = {
  sendMessage,
  getSession,
  listSessions,
  deleteSession,
  createSession,
};

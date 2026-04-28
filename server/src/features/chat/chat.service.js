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
    modeInstructions = 'Emphasize deep intuition, visual analogies, and high-level structure to help the user learn effectively. Always use Markdown lists (bullet points) and bolding to structure long text.';
    jsonSchema = `{
  "title": "Short descriptive title of the algorithm/concept",
  "approach": "Detailed explanation of the approach using markdown bullet points for readability",
  "intuition": "The core intuition using bullet points explaining WHY it works",
  "algorithm": "Step-by-step algorithm description using numbered markdown lists",
  "timeComplexity": {
    "best": "O(...)",
    "average": "O(...)",
    "worst": "O(...)",
    "explanation": "Brief explanation using bullet points"
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
  "comparisons": "Optional: strictly use a markdown table to compare this to alternative approaches",
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
 * Extracts pure behavioral instructions based on the mode.
 * @param {string} mode - The chat mode selected
 */
const getModeInstructions = (mode) => {
  if (mode === 'Code') {
    return 'You are a coding mentor. If they ask for an algorithm, provide instructions and boilerplate code. If they submit an execution error or failure log, clearly explain their mistake, point out the issue, and suggest improvements rather than just giving the final answer.';
  } else if (mode === 'Interview') {
    return 'Act as a technical interviewer. DO NOT just give the answer or write code. Guide the user, ask follow-up questions, discuss edge cases, and ask about potential optimizations. Engage in a dialogue to test their knowledge.';
  } else if (mode === 'DryRun') {
    return 'Focus on providing stepwise execution logic. Keep track of specific data structure and variable values at every iteration step. Format this step-by-step trace beautifully.';
  } else {
    return 'Emphasize deep intuition, visual analogies, and high-level structure to help the user learn effectively.';
  }
};

/**
 * Sends a message to Gemini and returns a structured response
 * @param {string} message - User message
 * @param {string} sessionId - Chat session ID
 * @param {string} mode - The chat mode selected
 * @param {string} llmModel - Model to use ('qwen' or 'gemini')
 * @param {Function} onStream - Callback for streaming chunks
 */
const sendMessage = async (message, sessionId, mode = 'Explain', llmModel = 'qwen', onStream = null) => {

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

  let finalContent = '';
  let structuredData = null;

  try {
    if (llmModel === 'qwen') {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 15000); // 15 seconds timeout

    try {
      // Get explicit instructions for how Qwen should behave based on the selected mode/role
      const modeSpecificInstructions = getModeInstructions(mode);

      // Rich system prompt for text-based Qwen to ensure high-quality Markdown structure
      const qwenSystem = `You are Zorithm, an elite algorithm and software engineering assistant.
YOUR CURRENT ROLE: **${mode.toUpperCase()} MODE**.

>>> CRITICAL ROLE INSTRUCTIONS <<<
${modeSpecificInstructions}
>>> END ROLE INSTRUCTIONS <<<

IMPORTANT FORMATTING RULES:
1. Provide a beautiful, well-structured Markdown response.
2. ALWAYS use clear headings (e.g., '## Approach', '## Intuition', '## Complexity', '## Implementation').
3. Use bullet points for sequential steps or key insights.
4. Use **bold text** for important terms and time/space complexities.
5. If providing code, always wrap it in standard markdown code blocks with the correct language syntax (e.g., \`\`\`javascript).
6. Write clearly, concisely, and professionally.
7. YOU MUST STRICTLY FOLLOW YOUR ROLE INSTRUCTIONS DEFINED ABOVE! IF YOU ARE AN INTERVIEWER, ACT LIKE ONE. IF YOU ARE DOING A DRY RUN, TRACE THE VARIABLES. DO NOT IGNORE YOUR ROLE!`;
      
      const response = await fetch('http://localhost:11434/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'qwen3:8b',
          messages: [
            { role: 'system', content: qwenSystem },
            { role: 'user', content: userPrompt }
          ],
          stream: true
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      const decoder = new TextDecoder();
      let buffer = '';
      
      // Node.js 18+ web stream async iteration
      for await (const chunk of response.body) {
        buffer += decoder.decode(chunk, { stream: true });
        let newlineIdx;
        while ((newlineIdx = buffer.indexOf('\n')) >= 0) {
          const line = buffer.slice(0, newlineIdx).trim();
          buffer = buffer.slice(newlineIdx + 1);
          if (line) {
            try {
              const parsed = JSON.parse(line);
              if (parsed.message?.content) {
                // Sanitize Unicode artifacts from Ollama streaming
                const chunkContent = parsed.message.content
                  .replace(/A²/g, '²')
                  .replace(/A³/g, '³')
                  .replace(/Aⁿ/g, 'ⁿ');
                finalContent += chunkContent;
                if (onStream) {
                  onStream(chunkContent);
                }
              }
            } catch (e) {
              // Ignore parse errors on incomplete chunks
            }
          }
        }
      }
    } catch (err) {
      console.warn('Qwen API Error or Timeout:', err.message);
      throw new Error(`Local Qwen model failed: ${err.message}`);
    } finally {
      clearTimeout(timeoutId);
    }
  } 
  
  if (llmModel === 'gemini') {
    try {
      // Call Gemini API
      const model = getModel('gemini-2.5-flash');
      const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;
      const result = await model.generateContent(fullPrompt);
      const rawText = result.response.text();
      
      // Parse structured response
      const parsed = parseGeminiResponse(rawText);
      structuredData = parsed;
      
      // Generate fallback plain text
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
      finalContent = fallback.trim() || rawText;

      if (onStream && finalContent) {
        // Stream the full fallback content to UI so it's not completely abrupt
        onStream(finalContent);
      }
    } catch (err) {
      console.error('Gemini API Error:', err.message);
      console.error('Gemini Full Error:', JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
      
      // Layer 3: Smart Fallback Generator
      const reason = err.message.includes('quota') ? 'API quota exhausted' 
        : err.message.includes('403') ? 'API key unauthorized or billing disabled'
        : err.message.includes('404') ? 'Model not available on your plan'
        : `API error: ${err.message}`;

      finalContent = `AI services are temporarily unavailable (${reason}). Please try again later or switch to the Qwen model.`;
      structuredData = {
        title: "System Fallback Response",
        approach: `The Gemini API returned an error: **${reason}**. You can try again or switch to the local Qwen model.`,
        keyInsights: ["Try switching to Qwen model", "Check your Google AI Studio dashboard for quota/billing"],
        isFallback: true
      };
      
      if (onStream) {
        onStream(finalContent);
      }
    }
  }

  } catch (fatalError) {
    console.error('Fatal error in chat service:', fatalError.message);
    // Ultimate safety net
    finalContent = `AI services encountered an unexpected error. Please try again.`;
    structuredData = {
      title: "System Fallback Response",
      approach: `An unexpected system error occurred: **${fatalError.message}**. Please try sending your message again.`,
      keyInsights: ["Try sending your message again", "Switch models if the issue persists"],
      isFallback: true
    };
    if (onStream) {
      onStream(finalContent);
    }
  }

  const botMessageId = generateId();

  // Store bot message in memory
  session.messages.push({
    id: botMessageId,
    role: 'assistant',
    content: finalContent,
    structured: structuredData,
    timestamp: new Date().toISOString(),
  });

  chatSessions.set(sessionId, session);

  return {
    messageId: botMessageId,
    sessionId,
    content: finalContent,
    structured: structuredData,
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

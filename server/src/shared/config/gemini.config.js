const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI = null;

/**
 * Returns a singleton instance of the GoogleGenerativeAI client.
 */
const getGeminiClient = () => {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'AQ.Ab8RN6IIuFrGrEzzBTx6uengSSRKCL57MluEoN5iE3LqEQikZA') {
      throw new Error('GEMINI_API_KEY is not configured in .env file');
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
};

/**
 * Returns the Gemini generative model instance.
 * @param {string} modelName - The model name to use
 */
const getModel = (modelName = 'gemini-2.5-flash') => {
  const client = getGeminiClient();
  return client.getGenerativeModel({ model: modelName });
};

module.exports = { getGeminiClient, getModel };

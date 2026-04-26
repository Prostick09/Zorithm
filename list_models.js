const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config({ path: "./server/.env" });

async function listModels() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  // Actually, listModels is not directly on genAI in the new SDK or it might be on a different path.
  // Wait, let's fetch it manually.
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
    const data = await response.json();
    console.log(data.models.map(m => m.name).join("\n"));
  } catch(e) {
    console.error(e);
  }
}

listModels();

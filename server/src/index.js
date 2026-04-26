require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`\n🚀 AlgoBot Server running on http://localhost:${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🤖 Gemini API: ${process.env.GEMINI_API_KEY ? '✅ Configured' : '❌ Missing API Key!'}`);
  
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/zorithm';
    await mongoose.connect(mongoUri);
    console.log(`🗄️  MongoDB Connected: ✅ Configured\n`);
  } catch (error) {
    console.error(`🗄️  MongoDB Error: ❌ Failed to connect!`, error.message);
  }
});

const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    required: true,
    enum: ['user', 'assistant', 'system']
  },
  content: {
    type: String,
    required: true
  },
  mode: {
    type: String,
    default: 'Explain'
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const historySchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  title: {
    type: String,
    default: 'New Chat'
  },
  messages: [messageSchema]
}, {
  timestamps: true
});

module.exports = mongoose.model('History', historySchema);

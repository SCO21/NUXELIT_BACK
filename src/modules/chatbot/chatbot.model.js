const mongoose = require('mongoose');
const { CHAT_ROLES, CHAT_STATUS } = require('../../utils/constants');

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: Object.values(CHAT_ROLES),
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  metadata: {
    toolsUsed: [String],
    intent: String,
    confidence: Number
  }
}, { _id: false });

const chatbotConversationSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  messages: [messageSchema],
  userInfo: {
    name: String,
    email: String,
    phone: String
  },
  status: {
    type: String,
    enum: Object.values(CHAT_STATUS),
    default: CHAT_STATUS.ACTIVE
  },
  escalatedTo: String,
  summary: String,
  tags: [String]
}, {
  timestamps: true
});

module.exports = mongoose.model('ChatbotConversation', chatbotConversationSchema);

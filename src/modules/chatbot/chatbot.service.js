const ChatbotConversation = require('./chatbot.model');
const { getPaginationData } = require('../../utils/pagination');
const { v4: uuidv4 } = require('uuid');
const siteConfigService = require('../siteConfig/siteConfig.service');
const { getSystemPrompt } = require('./chatbot.prompts');
const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');
const { HumanMessage, SystemMessage, AIMessage } = require('@langchain/core/messages');

const createSession = async (language = 'es') => {
  const sessionId = uuidv4();
  
  await ChatbotConversation.create({
    sessionId,
    messages: []
  });

  return {
    sessionId,
    welcomeMessage: '¡Hola! 👋 Soy el asistente virtual de Nuxelit. ¿En qué puedo ayudarte hoy?',
    suggestedQuestions: [
      '¿Qué servicios ofrecen?',
      '¿Cuánto cuesta un desarrollo web?',
      'Necesito un chatbot para mi empresa',
      '¿Cuál es el proceso de trabajo?'
    ]
  };
};

const processMessage = async (sessionId, incomingMessage) => {
  const conversation = await ChatbotConversation.findOne({ sessionId });
  
  if (!conversation) {
    throw new Error('Sesión no encontrada');
  }

  // Push user message to histories
  conversation.messages.push({
    role: 'user',
    content: incomingMessage
  });

  // Simplified logic without full LangChain tool calling for now, purely integrating OpenAI API
  const config = await siteConfigService.getConfig();
  const systemPrompt = getSystemPrompt(config);
  
  let responseText = '';
  // Call Gemini if API Key exists, else fallback
  if (process.env.GOOGLE_API_KEY) {
    try {
      const model = new ChatGoogleGenerativeAI({
        model: (process.env.GEMINI_MODEL || 'gemini-1.5-flash').trim(),
        temperature: parseFloat(process.env.LLM_TEMPERATURE) || 0.7,
        maxOutputTokens: parseInt(process.env.LLM_MAX_TOKENS) || 500,
        apiKey: process.env.GOOGLE_API_KEY.trim()
      });

      const messages = [new SystemMessage(systemPrompt)];
      
      // Load last 20 messages for context
      const history = conversation.messages.slice(-20);
      history.forEach(msg => {
        if (msg.role === 'user') messages.push(new HumanMessage(msg.content));
        if (msg.role === 'assistant') messages.push(new AIMessage(msg.content));
      });

      const response = await model.invoke(messages);
      responseText = response.content;

    } catch (err) {
      console.error(err);
      responseText = 'Lo siento, en este momento estoy experimentando dificultades técnicas. ¿Te gustaría dejar tu mensaje a nuestro equipo por el formulario de contacto?';
    }
  } else {
    // Fallback if no OpenAI Key configured
    responseText = 'Modo de desarrollo: La integración de IA no está configurada aún.';
  }

  // Save Assistant message
  conversation.messages.push({
    role: 'assistant',
    content: responseText,
    metadata: {
      intent: 'general', // Simplified
      confidence: 0.9
    }
  });

  await conversation.save();

  return {
    response: responseText,
    intent: 'general',
    suggestedActions: [],
    confidence: 0.9,
    escalate: false
  };
};

const getSessionHistory = async (sessionId) => {
  const conversation = await ChatbotConversation.findOne({ sessionId });
  if (!conversation) {
    throw new Error('Sesión no encontrada');
  }

  return {
    sessionId: conversation.sessionId,
    messages: conversation.messages,
    status: conversation.status,
    createdAt: conversation.createdAt
  };
};

const sendFeedback = async (feedbackData) => {
  const { sessionId, messageIndex, rating, comment } = feedbackData;
  // Feedback logic can be tracked or logged for fine-tuning
  return { message: 'Gracias por tu feedback' };
};

const getConversations = async (query, pagination) => {
  const { page, limit, skip } = pagination;
  const filter = {};
  if (query.status) filter.status = query.status;

  const conversations = await ChatbotConversation.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit);
  const total = await ChatbotConversation.countDocuments(filter);

  return {
    conversations,
    pagination: getPaginationData(total, page, limit),
    stats: {
      totalConversations: total,
      avgMessagesPerSession: 0,
      escalationRate: 0,
      topIntents: []
    }
  };
};

module.exports = {
  createSession,
  processMessage,
  getSessionHistory,
  sendFeedback,
  getConversations
};

const chatbotService = require('./chatbot.service');
const { successResponse, errorResponse } = require('../../utils/responseHelper');
const { getPagination } = require('../../utils/pagination');

const createSession = async (req, res, next) => {
  try {
    const result = await chatbotService.createSession(req.body.language);
    return successResponse(res, result, 'Sesión creada', 201);
  } catch (error) {
    next(error);
  }
};

const processMessage = async (req, res, next) => {
  try {
    const { sessionId, message } = req.body;
    const result = await chatbotService.processMessage(sessionId, message);
    return successResponse(res, result, 'Mensaje procesado');
  } catch (error) {
    if (error.message === 'Sesión no encontrada') return errorResponse(res, error.message, 404);
    next(error);
  }
};

const getSessionHistory = async (req, res, next) => {
  try {
    const history = await chatbotService.getSessionHistory(req.params.sessionId);
    return successResponse(res, history, 'Historial obtenido');
  } catch (error) {
    if (error.message === 'Sesión no encontrada') return errorResponse(res, error.message, 404);
    next(error);
  }
};

const sendFeedback = async (req, res, next) => {
  try {
    const result = await chatbotService.sendFeedback(req.body);
    return successResponse(res, null, result.message);
  } catch (error) {
    next(error);
  }
};

const getConversations = async (req, res, next) => {
  try {
    const result = await chatbotService.getConversations(req.query, getPagination(req.query));
    return successResponse(res, result, 'Conversaciones obtenidas');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSession,
  processMessage,
  getSessionHistory,
  sendFeedback,
  getConversations
};

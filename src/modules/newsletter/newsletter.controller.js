const newsletterService = require('./newsletter.service');
const { successResponse, errorResponse } = require('../../utils/responseHelper');
const { getPagination } = require('../../utils/pagination');

const subscribe = async (req, res, next) => {
  try {
    const { email } = req.body;
    await newsletterService.subscribe(email);
    return successResponse(res, null, '¡Te has suscrito exitosamente al newsletter!', 201);
  } catch (error) {
    if (error.message === 'Este email ya está suscrito') {
      return res.status(409).json({ success: false, message: error.message });
    }
    next(error);
  }
};

const unsubscribe = async (req, res, next) => {
  try {
    const { email } = req.body;
    await newsletterService.unsubscribe(email);
    return successResponse(res, null, 'Te has desuscrito del newsletter');
  } catch (error) {
    next(error);
  }
};

const getSubscribers = async (req, res, next) => {
  try {
    const result = await newsletterService.getSubscribers(req.query, getPagination(req.query));
    return successResponse(res, result, 'Suscriptores obtenidos');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  subscribe,
  unsubscribe,
  getSubscribers
};

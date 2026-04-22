const quoteService = require('./quote.service');
const { successResponse, errorResponse } = require('../../utils/responseHelper');
const { getPagination } = require('../../utils/pagination');

const createQuote = async (req, res, next) => {
  try {
    const result = await quoteService.createQuote(req.body);
    return successResponse(res, result, 'Cotización creada exitosamente', 201);
  } catch (error) {
    next(error);
  }
};

const getQuotes = async (req, res, next) => {
  try {
    const result = await quoteService.getQuotes(req.query, getPagination(req.query));
    return successResponse(res, result, 'Cotizaciones obtenidas');
  } catch (error) {
    next(error);
  }
};

const getQuoteById = async (req, res, next) => {
  try {
    const quote = await quoteService.getQuoteById(req.params.id);
    return successResponse(res, quote, 'Cotización obtenida');
  } catch (error) {
    if (error.message === 'Cotización no encontrada') return errorResponse(res, error.message, 404);
    next(error);
  }
};

const updateQuote = async (req, res, next) => {
  try {
    const quote = await quoteService.updateQuote(req.params.id, req.body);
    return successResponse(res, quote, 'Cotización actualizada');
  } catch (error) {
    if (error.message === 'Cotización no encontrada') return errorResponse(res, error.message, 404);
    next(error);
  }
};

const deleteQuote = async (req, res, next) => {
  try {
    await quoteService.deleteQuote(req.params.id);
    return successResponse(res, null, 'Cotización eliminada');
  } catch (error) {
    if (error.message === 'Cotización no encontrada') return errorResponse(res, error.message, 404);
    next(error);
  }
};

module.exports = {
  createQuote,
  getQuotes,
  getQuoteById,
  updateQuote,
  deleteQuote
};

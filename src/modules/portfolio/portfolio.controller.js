const portfolioService = require('./portfolio.service');
const { successResponse, errorResponse } = require('../../utils/responseHelper');
const { getPagination } = require('../../utils/pagination');

const getPortfolios = async (req, res, next) => {
  try {
    const result = await portfolioService.getPortfolios(req.query, getPagination(req.query));
    return successResponse(res, result, 'Proyectos obtenidos');
  } catch (error) {
    next(error);
  }
};

const createPortfolio = async (req, res, next) => {
  try {
    const project = await portfolioService.createPortfolio(req.body, req.file);
    return successResponse(res, project, 'Proyecto creado exitosamente', 201);
  } catch (error) {
    next(error);
  }
};

const updatePortfolio = async (req, res, next) => {
  try {
    const project = await portfolioService.updatePortfolio(req.params.id, req.body, req.file);
    return successResponse(res, project, 'Proyecto actualizado');
  } catch (error) {
    if (error.message === 'Proyecto no encontrado') return errorResponse(res, error.message, 404);
    next(error);
  }
};

const deletePortfolio = async (req, res, next) => {
  try {
    await portfolioService.deletePortfolio(req.params.id);
    return successResponse(res, null, 'Proyecto eliminado');
  } catch (error) {
    if (error.message === 'Proyecto no encontrado') return errorResponse(res, error.message, 404);
    next(error);
  }
};

module.exports = {
  getPortfolios,
  createPortfolio,
  updatePortfolio,
  deletePortfolio
};

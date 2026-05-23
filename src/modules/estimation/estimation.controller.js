const estimationService = require('./estimation.service');
const { successResponse, errorResponse } = require('../../utils/responseHelper');
const { getPagination } = require('../../utils/pagination');

const createEstimation = async (req, res, next) => {
  try {
    const createdBy = req.user ? req.user._id : null;
    const result = await estimationService.createEstimation(req.body, createdBy);
    return successResponse(res, result, 'Estimación creada exitosamente', 201);
  } catch (error) {
    next(error);
  }
};

const getEstimations = async (req, res, next) => {
  try {
    const result = await estimationService.getEstimations(req.query, req.query);
    return successResponse(res, result, 'Estimaciones obtenidas exitosamente');
  } catch (error) {
    next(error);
  }
};

const getEstimationById = async (req, res, next) => {
  try {
    const result = await estimationService.getEstimationById(req.params.id);
    return successResponse(res, result, 'Estimación obtenida exitosamente');
  } catch (error) {
    if (error.status === 404) return errorResponse(res, error.message, 404);
    next(error);
  }
};

const updateEstimation = async (req, res, next) => {
  try {
    const result = await estimationService.updateEstimation(req.params.id, req.body);
    return successResponse(res, result, 'Estimación actualizada exitosamente');
  } catch (error) {
    if (error.status === 404) return errorResponse(res, error.message, 404);
    next(error);
  }
};

const updateEstimationStatus = async (req, res, next) => {
  try {
    const result = await estimationService.updateEstimationStatus(req.params.id, req.body.status);
    return successResponse(res, result, 'Estado de estimación actualizado exitosamente');
  } catch (error) {
    if (error.status === 404) return errorResponse(res, error.message, 404);
    next(error);
  }
};

const deleteEstimation = async (req, res, next) => {
  try {
    await estimationService.deleteEstimation(req.params.id);
    return successResponse(res, null, 'Estimación eliminada exitosamente');
  } catch (error) {
    if (error.status === 404) return errorResponse(res, error.message, 404);
    next(error);
  }
};

const duplicateEstimation = async (req, res, next) => {
  try {
    const result = await estimationService.duplicateEstimation(req.params.id);
    return successResponse(res, result, 'Estimación duplicada exitosamente', 201);
  } catch (error) {
    if (error.status === 404) return errorResponse(res, error.message, 404);
    next(error);
  }
};

const getEstimationStats = async (req, res, next) => {
  try {
    const result = await estimationService.getEstimationStats();
    return successResponse(res, result, 'Estadísticas obtenidas exitosamente');
  } catch (error) {
    next(error);
  }
};

const renderEstimationHtml = async (req, res, next) => {
  try {
    const html = await estimationService.renderEstimationHtml(req.params.id);
    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(html);
  } catch (error) {
    if (error.status === 404) return errorResponse(res, error.message, 404);
    next(error);
  }
};

const addArchitectureImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return errorResponse(res, 'No se proporcionó ningún archivo de imagen', 400);
    }
    const result = await estimationService.addArchitectureImage(req.params.id, req.file);
    return successResponse(res, result, 'Imagen de arquitectura agregada exitosamente');
  } catch (error) {
    if (error.status === 404) return errorResponse(res, error.message, 404);
    next(error);
  }
};

const removeArchitectureImage = async (req, res, next) => {
  try {
    const result = await estimationService.removeArchitectureImage(req.params.id, req.params.index);
    return successResponse(res, result, 'Imagen de arquitectura eliminada exitosamente');
  } catch (error) {
    if (error.status === 404) return errorResponse(res, error.message, 404);
    next(error);
  }
};

const getCatalog = async (req, res, next) => {
  try {
    const result = await estimationService.getCatalog();
    return successResponse(res, result, 'Catálogo obtenido exitosamente');
  } catch (error) {
    next(error);
  }
};

const updateCatalog = async (req, res, next) => {
  try {
    const result = await estimationService.updateCatalog(req.body);
    return successResponse(res, result, 'Catálogo actualizado exitosamente');
  } catch (error) {
    next(error);
  }
};

const importCatalog = async (req, res, next) => {
  try {
    const result = await estimationService.importCatalogFromExcel(req.body);
    return successResponse(res, result, 'Catálogo importado exitosamente desde Excel');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createEstimation,
  getEstimations,
  getEstimationById,
  updateEstimation,
  updateEstimationStatus,
  deleteEstimation,
  duplicateEstimation,
  getEstimationStats,
  renderEstimationHtml,
  addArchitectureImage,
  removeArchitectureImage,
  getCatalog,
  updateCatalog,
  importCatalog
};

const serviceService = require('./service.service');
const { successResponse, errorResponse } = require('../../utils/responseHelper');

const getServices = async (req, res, next) => {
  try {
    const services = await serviceService.getServices(req.query);
    return successResponse(res, { services }, 'Servicios obtenidos');
  } catch (error) {
    next(error);
  }
};

const createService = async (req, res, next) => {
  try {
    const service = await serviceService.createService(req.body, req.file);
    return successResponse(res, service, 'Servicio creado exitosamente', 201);
  } catch (error) {
    next(error);
  }
};

const updateService = async (req, res, next) => {
  try {
    const service = await serviceService.updateService(req.params.id, req.body, req.file);
    return successResponse(res, service, 'Servicio actualizado');
  } catch (error) {
    if (error.message === 'Servicio no encontrado') return errorResponse(res, error.message, 404);
    next(error);
  }
};

const deleteService = async (req, res, next) => {
  try {
    await serviceService.deleteService(req.params.id);
    return successResponse(res, null, 'Servicio eliminado');
  } catch (error) {
    if (error.message === 'Servicio no encontrado') return errorResponse(res, error.message, 404);
    next(error);
  }
};

module.exports = {
  getServices,
  createService,
  updateService,
  deleteService
};

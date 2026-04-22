const planService = require('./plan.service');
const { successResponse, errorResponse } = require('../../utils/responseHelper');

const getPlans = async (req, res, next) => {
  try {
    const plans = await planService.getPlans(req.query);
    return successResponse(res, { plans }, 'Planes obtenidos');
  } catch (error) {
    next(error);
  }
};

const createPlan = async (req, res, next) => {
  try {
    const plan = await planService.createPlan(req.body);
    return successResponse(res, plan, 'Plan creado exitosamente', 201);
  } catch (error) {
    next(error);
  }
};

const updatePlan = async (req, res, next) => {
  try {
    const plan = await planService.updatePlan(req.params.id, req.body);
    return successResponse(res, plan, 'Plan actualizado');
  } catch (error) {
    if (error.message === 'Plan no encontrado') return errorResponse(res, error.message, 404);
    next(error);
  }
};

const deletePlan = async (req, res, next) => {
  try {
    await planService.deletePlan(req.params.id);
    return successResponse(res, null, 'Plan eliminado');
  } catch (error) {
    if (error.message === 'Plan no encontrado') return errorResponse(res, error.message, 404);
    next(error);
  }
};

module.exports = {
  getPlans,
  createPlan,
  updatePlan,
  deletePlan
};

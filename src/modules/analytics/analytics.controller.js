const analyticsService = require('./analytics.service');
const { successResponse } = require('../../utils/responseHelper');

const registerEvent = async (req, res, next) => {
  try {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    await analyticsService.registerEvent(req.body, ip, userAgent);
    return successResponse(res, null, 'Evento registrado', 201);
  } catch (error) {
    next(error);
  }
};

const getDashboard = async (req, res, next) => {
  try {
    const dashboard = await analyticsService.getDashboardSummary(req.query);
    return successResponse(res, dashboard, 'Dashboard obtenido');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerEvent,
  getDashboard
};

const siteConfigService = require('./siteConfig.service');
const { successResponse } = require('../../utils/responseHelper');

const getConfig = async (req, res, next) => {
  try {
    const config = await siteConfigService.getConfig();
    return successResponse(res, config, 'Configuración obtenida');
  } catch (error) {
    next(error);
  }
};

const updateConfig = async (req, res, next) => {
  try {
    const config = await siteConfigService.updateConfig(req.body);
    return successResponse(res, config, 'Configuración del sitio actualizada');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getConfig,
  updateConfig
};

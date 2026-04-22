const logger = require('../utils/logger');
const { errorResponse } = require('../utils/responseHelper');

const errorHandler = (err, req, res, next) => {
  logger.error(`${err.name}: ${err.message}\n${err.stack}`);

  if (err.name === 'ValidationError') {
    return errorResponse(res, 'Error de validación (Mongoose)', 400, Object.values(err.errors).map(val => val.message));
  }

  if (err.code === 11000) {
    return errorResponse(res, 'Valor duplicado ingresado', 400);
  }

  if (err.name === 'CastError') {
    return errorResponse(res, 'Recurso no encontrado', 404);
  }

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Error interno del servidor',
    data: null,
    errors: process.env.NODE_ENV === 'development' ? err.stack : null
  });
};

module.exports = errorHandler;

const jwt = require('jsonwebtoken');
const { errorResponse } = require('../utils/responseHelper');
const User = require('../modules/admin/user.model');

const protect = async (req, res, next) => {
  let token;

  // Extract Bearer token from authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return errorResponse(res, 'No autorizado, no hay token', 401);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user and select everything except passwordHash and twoFactorSecret
    req.user = await User.findById(decoded.id);
    
    if (!req.user) {
      return errorResponse(res, 'Usuario no encontrado', 401);
    }

    if (!req.user.isActive) {
      return errorResponse(res, 'Esta cuenta ha sido desactivada', 401);
    }
    
    next();
  } catch (error) {
    return errorResponse(res, 'No autorizado, token fallido o expirado', 401);
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return errorResponse(res, `El rol ${req.user.role} no está autorizado para acceder a esta ruta`, 403);
    }
    next();
  };
};

module.exports = { protect, authorize };

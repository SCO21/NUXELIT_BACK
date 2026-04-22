const jwt = require('jsonwebtoken');
const { errorResponse } = require('../utils/responseHelper');
const Admin = require('../modules/admin/admin.model');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return errorResponse(res, 'No autorizado, no hay token', 401);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await Admin.findById(decoded.id).select('-password');
    
    if (!req.user || !req.user.isActive) {
      return errorResponse(res, 'Usuario no encontrado o inactivo', 401);
    }
    
    next();
  } catch (error) {
    return errorResponse(res, 'No autorizado, token fallido', 401);
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

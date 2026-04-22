const adminService = require('./admin.service');
const { successResponse, errorResponse } = require('../../utils/responseHelper');

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await adminService.login(email, password);
    return successResponse(res, result, 'Login exitoso');
  } catch (error) {
    if (error.message === 'Credenciales inválidas') {
      return errorResponse(res, error.message, 401);
    }
    next(error);
  }
};

const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const result = await adminService.refresh(refreshToken);
    return successResponse(res, result, 'Token renovado');
  } catch (error) {
    return errorResponse(res, error.message, 401);
  }
};

const register = async (req, res, next) => {
  try {
    const result = await adminService.register(req.body);
    return successResponse(res, result, 'Administrador creado', 201);
  } catch (error) {
    next(error);
  }
};

const getProfile = async (req, res, next) => {
  try {
    return successResponse(res, req.user, 'Perfil obtenido');
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    await adminService.updateProfile(req.user.id, req.body);
    return successResponse(res, null, 'Perfil actualizado');
  } catch (error) {
    if (error.message.includes('Contraseña')) {
      return errorResponse(res, error.message, 400);
    }
    next(error);
  }
};

module.exports = {
  login,
  refresh,
  register,
  getProfile,
  updateProfile
};

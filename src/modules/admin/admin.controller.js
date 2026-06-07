const adminService = require('./admin.service');
const { successResponse, errorResponse } = require('../../utils/responseHelper');

/**
 * Configure secure HttpOnly cookie for Refresh Token
 */
const setRefreshTokenCookie = (res, token) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: isProduction, // Send only over HTTPS in production
    sameSite: 'Strict',   // Prevent CSRF attacks
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days (matching token expiration)
  });
};

/**
 * Step 1: Login Credentials (Email & Password)
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await adminService.loginStep1(email, password, req);
    
    // Returns status: REQUIRES_2FA or REQUIRES_SETUP
    return successResponse(res, result, 'Credenciales verificadas');
  } catch (error) {
    if (error.message === 'Credenciales inválidas') {
      return errorResponse(res, error.message, 401);
    }
    if (error.message.includes('bloqueada')) {
      return errorResponse(res, error.message, 423); // 423 Locked
    }
    next(error);
  }
};

/**
 * Step 2: Verify TOTP Code
 */
const verifyTOTP = async (req, res, next) => {
  try {
    const { preAuthToken, code } = req.body;
    
    if (!preAuthToken || !code) {
      return errorResponse(res, 'Faltan parámetros requeridos', 400);
    }
    
    const result = await adminService.verifyTOTP(preAuthToken, code, req);
    
    // Set Refresh Token as Secure HttpOnly Cookie
    setRefreshTokenCookie(res, result.refreshToken);
    
    // Return Access Token in body
    return successResponse(res, {
      accessToken: result.accessToken,
      user: result.user
    }, 'Inicio de sesión exitoso');
  } catch (error) {
    return errorResponse(res, error.message, 401);
  }
};

/**
 * Step 2 (Alternate): Complete TOTP 2FA Setup
 */
const setupTOTP = async (req, res, next) => {
  try {
    const { preAuthToken, code, newPassword } = req.body;
    
    if (!preAuthToken || !code) {
      return errorResponse(res, 'Faltan parámetros requeridos', 400);
    }
    
    const result = await adminService.setupTOTP(preAuthToken, code, newPassword, req);
    
    setRefreshTokenCookie(res, result.refreshToken);
    
    return successResponse(res, {
      accessToken: result.accessToken,
      user: result.user
    }, 'Configuración de 2FA exitosa y login completado');
  } catch (error) {
    return errorResponse(res, error.message, 401);
  }
};

/**
 * Refresh Access Token using Rotate Refresh Token in Cookie
 */
const refresh = async (req, res, next) => {
  try {
    // Read from cookies first, fallback to request body for flexibility
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    
    if (!refreshToken) {
      return errorResponse(res, 'Token de refresco requerido', 401);
    }
    
    const result = await adminService.refresh(refreshToken, req);
    
    // Set new rotated Refresh Token cookie
    setRefreshTokenCookie(res, result.refreshToken);
    
    // Return new Access Token
    return successResponse(res, {
      accessToken: result.accessToken
    }, 'Token renovado exitosamente');
  } catch (error) {
    // If validation fails, clear cookie on client side
    res.clearCookie('refreshToken');
    return errorResponse(res, error.message, 401);
  }
};

/**
 * Close current session (Logout)
 */
const logout = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    
    if (refreshToken) {
      await adminService.logout(refreshToken, req);
    }
    
    // Clear cookies
    res.clearCookie('refreshToken');
    return successResponse(res, null, 'Sesión cerrada exitosamente');
  } catch (error) {
    next(error);
  }
};

/**
 * Close all active sessions across devices
 */
const logoutGlobal = async (req, res, next) => {
  try {
    await adminService.logoutGlobal(req.user.id, req);
    res.clearCookie('refreshToken');
    return successResponse(res, null, 'Todas las sesiones activas han sido cerradas');
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieve Audit logs (Console View)
 */
const getAuditLogs = async (req, res, next) => {
  try {
    const { action, search, page, limit } = req.query;
    
    const logsData = await adminService.getAuditLogs(
      { action, search },
      parseInt(page, 10) || 1,
      parseInt(limit, 10) || 50
    );
    
    return successResponse(res, logsData, 'Logs de auditoría obtenidos');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  verifyTOTP,
  setupTOTP,
  refresh,
  logout,
  logoutGlobal,
  getAuditLogs
};

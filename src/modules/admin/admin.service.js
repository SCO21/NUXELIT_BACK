const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const argon2 = require('argon2');
const twofactor = require('node-2fa');
const qrcode = require('qrcode');
const User = require('./user.model');
const AuditLog = require('./auditLog.model');
const { logAudit } = require('../../utils/auditLogger');

/**
 * Helper to hash a token for database storage
 */
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Generate Access Token
 */
const generateAccessToken = (user) => {
  return jwt.sign({
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role
  }, process.env.JWT_SECRET, {
    expiresIn: '15m'
  });
};

/**
 * Generate Refresh Token
 */
const generateRefreshToken = (user) => {
  return jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET || 'refresh-secret', {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  });
};

/**
 * Step 1: Credentials verification
 */
const loginStep1 = async (email, password, req) => {
  const normalizedEmail = email.trim().toLowerCase();
  
  // Find user and select passwordHash
  const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash +twoFactorSecret');
  
  // Timing attack protection: if user not found, verify a dummy hash
  if (!user) {
    const dummyHash = '$argon2id$v=19$m=65536,t=3,p=4$vU0nNzV3NHU4eDg$jJz57p6QZ+y1jKx2T+F2bZ';
    await argon2.verify(dummyHash, password);
    
    // Log failed login audit with the input email
    await logAudit({
      email: normalizedEmail,
      action: 'LOGIN_FAILED_CREDENTIALS',
      req
    });
    
    throw new Error('Credenciales inválidas');
  }

  // Check database lockout status
  if (user.isLocked()) {
    const timeRemaining = Math.ceil((user.lockUntil - Date.now()) / 60000);
    
    await logAudit({
      userId: user._id,
      email: user.email,
      action: 'LOGIN_FAILED_LOCKED_ACCOUNT',
      req
    });
    
    throw new Error(`Cuenta temporalmente bloqueada. Intente de nuevo en ${timeRemaining} minuto(s).`);
  }

  // Match password
  const isMatch = await user.matchPassword(password);
  
  if (!isMatch) {
    // Increment failed attempts
    user.failedLoginAttempts += 1;
    
    if (user.failedLoginAttempts >= 5) {
      user.lockUntil = Date.now() + 15 * 60 * 1000; // 15-minute lock
      await logAudit({
        userId: user._id,
        email: user.email,
        action: 'ACCOUNT_LOCKED',
        req
      });
    } else {
      await logAudit({
        userId: user._id,
        email: user.email,
        action: 'LOGIN_FAILED_CREDENTIALS',
        req
      });
    }
    
    await user.save();
    throw new Error('Credenciales inválidas');
  }

  // Active status check
  if (!user.isActive) {
    await logAudit({
      userId: user._id,
      email: user.email,
      action: 'LOGIN_FAILED_INACTIVE',
      req
    });
    throw new Error('Credenciales inválidas');
  }

  // Reset failed attempts upon successful Step 1 password verification
  user.failedLoginAttempts = 0;
  user.lockUntil = undefined;
  await user.save();

  // Handle 2FA Enrollment (First login) vs normal 2FA verification
  if (!user.twoFactorEnabled) {
    // Generate temporary secret using node-2fa
    const newSecret = twofactor.generateSecret({ name: 'NUXELIT Admin Portal', account: user.email });
    const tempSecret = newSecret.secret;
    user.twoFactorSecret = tempSecret;
    await user.save();

    // Create provisioning URI and QR Code
    const otpauthUrl = newSecret.uri;
    const qrCodeDataUrl = await qrcode.toDataURL(otpauthUrl);

    // Sign a temporary preAuthToken that contains the setup state and tempSecret
    const preAuthToken = jwt.sign(
      { id: user._id, type: '2fa_setup' },
      process.env.JWT_SECRET,
      { expiresIn: '5m' }
    );

    return {
      status: 'REQUIRES_SETUP',
      preAuthToken,
      qrCodeDataUrl,
      secret: tempSecret
    };
  }

  // If 2FA is already enabled, sign a standard verification preAuthToken
  const preAuthToken = jwt.sign(
    { id: user._id, type: '2fa_verify' },
    process.env.JWT_SECRET,
    { expiresIn: '5m' }
  );

  return {
    status: 'REQUIRES_2FA',
    preAuthToken
  };
};

/**
 * Step 2: Verify TOTP Code and issue final session tokens
 */
const verifyTOTP = async (preAuthToken, code, req) => {
  let decoded;
  try {
    decoded = jwt.verify(preAuthToken, process.env.JWT_SECRET);
  } catch (err) {
    throw new Error('Sesión de autenticación inválida o expirada. Por favor intente de nuevo.');
  }

  if (decoded.type !== '2fa_verify') {
    throw new Error('Paso de autenticación inválido.');
  }

  const user = await User.findById(decoded.id).select('+twoFactorSecret');
  if (!user || !user.isActive) {
    throw new Error('Usuario inválido o inactivo.');
  }

  // Check if account locked
  if (user.isLocked()) {
    throw new Error('Cuenta temporalmente bloqueada.');
  }

  // Verify TOTP token
  const result = twofactor.verifyToken(user.twoFactorSecret, code, 1);
  const isValid = result !== null;

  if (!isValid) {
    // Increment failed attempts for security (prevents brute forcing the 6 digits)
    user.failedLoginAttempts += 1;
    if (user.failedLoginAttempts >= 5) {
      user.lockUntil = Date.now() + 15 * 60 * 1000;
      await logAudit({
        userId: user._id,
        email: user.email,
        action: 'ACCOUNT_LOCKED',
        req
      });
    } else {
      await logAudit({
        userId: user._id,
        email: user.email,
        action: 'LOGIN_FAILED_2FA',
        req
      });
    }
    await user.save();
    throw new Error('Código de autenticación inválido');
  }

  // Login successful
  user.failedLoginAttempts = 0;
  user.lockUntil = undefined;
  user.lastLogin = new Date();
  
  // Issue Session Tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Hash and save Refresh Token to database
  const tokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days matching token expiration
  
  user.refreshTokens.push({ tokenHash, expiresAt });
  await user.save();

  await logAudit({
    userId: user._id,
    email: user.email,
    action: 'LOGIN_SUCCESS',
    req
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  };
};

/**
 * Step 2 (Alternate): Configure/Verify initial TOTP Setup
 */
const setupTOTP = async (preAuthToken, code, newPassword, req) => {
  let decoded;
  try {
    decoded = jwt.verify(preAuthToken, process.env.JWT_SECRET);
  } catch (err) {
    throw new Error('Sesión de autenticación inválida o expirada. Por favor intente de nuevo.');
  }

  if (decoded.type !== '2fa_setup') {
    throw new Error('Paso de configuración inválido.');
  }

  const user = await User.findById(decoded.id).select('+twoFactorSecret');
  if (!user || !user.isActive) {
    throw new Error('Usuario inválido o inactivo.');
  }

  // Verify code with temporary secret
  const result = twofactor.verifyToken(user.twoFactorSecret, code, 1);
  const isValid = result !== null;

  if (!isValid) {
    throw new Error('Código de verificación incorrecto. Escanea el QR e introduce el código actual.');
  }

  // Update password to permanent one if provided
  if (newPassword) {
    if (newPassword.length < 8) {
      throw new Error('La nueva contraseña debe tener al menos 8 caracteres.');
    }
    user.passwordHash = newPassword;
  }

  // Activate 2FA
  user.twoFactorEnabled = true;
  user.lastLogin = new Date();
  
  // Issue Session Tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Hash and save Refresh Token to database
  const tokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  
  user.refreshTokens.push({ tokenHash, expiresAt });
  await user.save();

  await logAudit({
    userId: user._id,
    email: user.email,
    action: '2FA_SETUP_SUCCESS',
    req
  });

  await logAudit({
    userId: user._id,
    email: user.email,
    action: 'LOGIN_SUCCESS',
    req
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  };
};

/**
 * Refresh Token Rotation (RTR)
 */
const refresh = async (refreshToken, req) => {
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'refresh-secret');
    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      throw new Error('Usuario inválido o inactivo');
    }

    const tokenHash = hashToken(refreshToken);
    const tokenIndex = user.refreshTokens.findIndex(t => t.tokenHash === tokenHash);

    // Reuse detection
    if (tokenIndex === -1) {
      // Clear all active sessions (breach assumption)
      user.refreshTokens = [];
      await user.save();
      
      await logAudit({
        userId: user._id,
        email: user.email,
        action: 'REFRESH_TOKEN_REUSE_DETECTED',
        req
      });
      
      throw new Error('Invasión o token reutilizado. Sesiones cerradas por seguridad.');
    }

    // Check expiration
    const currentToken = user.refreshTokens[tokenIndex];
    if (currentToken.expiresAt < new Date()) {
      user.refreshTokens.splice(tokenIndex, 1);
      await user.save();
      throw new Error('Refresh Token expirado');
    }

    // Generate new set of tokens
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);
    const newHash = hashToken(newRefreshToken);
    const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Replace the old token with the new one in DB (Rotation)
    user.refreshTokens.splice(tokenIndex, 1, { tokenHash: newHash, expiresAt: newExpiresAt });
    await user.save();

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    };
  } catch (err) {
    throw new Error(err.message || 'Token de refresco inválido o expirado');
  }
};

/**
 * Logout single session
 */
const logout = async (refreshToken, req) => {
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'refresh-secret');
    const user = await User.findById(decoded.id);
    
    if (user) {
      const tokenHash = hashToken(refreshToken);
      user.refreshTokens = user.refreshTokens.filter(t => t.tokenHash !== tokenHash);
      await user.save();
      
      await logAudit({
        userId: user._id,
        email: user.email,
        action: 'LOGOUT',
        req
      });
    }
  } catch (err) {
    // Fail silently on token validation errors during logout
  }
};

/**
 * Logout all active devices / sessions
 */
const logoutGlobal = async (userId, req) => {
  const user = await User.findById(userId);
  if (user) {
    user.refreshTokens = [];
    await user.save();
    
    await logAudit({
      userId: user._id,
      email: user.email,
      action: 'GLOBAL_LOGOUT',
      req
    });
  }
};

/**
 * Fetch logs for Console View
 */
const getAuditLogs = async (filters, page = 1, limit = 50) => {
  const query = {};
  if (filters.action) {
    query.action = filters.action;
  }
  if (filters.search) {
    query.$or = [
      { email: { $regex: filters.search, $options: 'i' } },
      { ipAddress: { $regex: filters.search, $options: 'i' } }
    ];
  }

  const logs = await AuditLog.find(query)
    .populate('userId', 'name email')
    .sort({ timestamp: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const total = await AuditLog.countDocuments(query);

  return {
    logs,
    total,
    pages: Math.ceil(total / limit)
  };
};

module.exports = {
  loginStep1,
  verifyTOTP,
  setupTOTP,
  refresh,
  logout,
  logoutGlobal,
  getAuditLogs
};

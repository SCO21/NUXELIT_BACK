const jwt = require('jsonwebtoken');
const Admin = require('./admin.model');

const generateTokens = (id) => {
  const accessToken = jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1h'
  });
  
  const refreshToken = jwt.sign({ id }, process.env.JWT_REFRESH_SECRET || 'refresh-secret', {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  });

  return { accessToken, refreshToken };
};

const login = async (email, password) => {
  const admin = await Admin.findOne({ email }).select('+password');
  
  if (!admin || !admin.isActive) {
    throw new Error('Credenciales inválidas');
  }

  const isMatch = await admin.matchPassword(password);
  
  if (!isMatch) {
    throw new Error('Credenciales inválidas');
  }

  admin.lastLogin = new Date();
  await admin.save();

  const { accessToken, refreshToken } = generateTokens(admin._id);

  return {
    accessToken,
    refreshToken,
    user: {
      id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role
    }
  };
};

const register = async (adminData) => {
  const existing = await Admin.findOne({ email: adminData.email });
  if (existing) {
    throw new Error('El correo ya está en uso');
  }

  const admin = await Admin.create(adminData);
  return {
    id: admin._id,
    name: admin.name,
    email: admin.email,
    role: admin.role
  };
};

const refresh = async (refreshToken) => {
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'refresh-secret');
    const admin = await Admin.findById(decoded.id);
    
    if (!admin || !admin.isActive) {
      throw new Error('Usuario inválido');
    }

    const tokens = generateTokens(admin._id);
    return { accessToken: tokens.accessToken };
  } catch (err) {
    throw new Error('Token de refresco inválido o expirado');
  }
};

const updateProfile = async (id, profileData) => {
  const admin = await Admin.findById(id).select('+password');
  
  if (profileData.name) admin.name = profileData.name;
  if (profileData.email) admin.email = profileData.email;
  
  if (profileData.newPassword) {
    if (!profileData.currentPassword) {
      throw new Error('Contraseña actual requerida para actualizar');
    }
    const isMatch = await admin.matchPassword(profileData.currentPassword);
    if (!isMatch) {
      throw new Error('Contraseña actual incorrecta');
    }
    admin.password = profileData.newPassword;
  }

  await admin.save();
  return {
    id: admin._id,
    name: admin.name,
    email: admin.email,
    role: admin.role
  };
};

module.exports = {
  login,
  register,
  refresh,
  updateProfile
};

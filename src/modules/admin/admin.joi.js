const Joi = require('joi');
const { ROLES } = require('../../utils/constants');

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Ingresa un correo válido',
    'any.required': 'El correo es requerido'
  }),
  password: Joi.string().min(8).required().messages({
    'string.min': 'La contraseña debe tener al menos 8 caracteres',
    'any.required': 'La contraseña es requerida'
  })
});

const registerSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  role: Joi.string().valid(ROLES.ADMIN, ROLES.EDITOR)
});

const refreshSchema = Joi.object({
  refreshToken: Joi.string().required()
});

const profileUpdateSchema = Joi.object({
  name: Joi.string().optional(),
  email: Joi.string().email().optional(),
  currentPassword: Joi.string().min(8).optional(),
  newPassword: Joi.string().min(8).optional()
}).with('newPassword', 'currentPassword');

module.exports = {
  loginSchema,
  registerSchema,
  refreshSchema,
  profileUpdateSchema
};

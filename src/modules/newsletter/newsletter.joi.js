const Joi = require('joi');

const subscribeSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Ingresa un correo válido',
    'any.required': 'El correo es requerido'
  })
});

module.exports = { subscribeSchema };

const Joi = require('joi');

const serviceSchema = Joi.object({
  icon: Joi.string().required(),
  title: Joi.string().required(),
  description: Joi.string().required(),
  order: Joi.number().optional(),
  isActive: Joi.boolean().optional()
  // Image is handled by multer
});

const serviceUpdateSchema = Joi.object({
  icon: Joi.string().optional(),
  title: Joi.string().optional(),
  description: Joi.string().optional(),
  order: Joi.number().optional(),
  isActive: Joi.boolean().optional()
  // Image is handled by multer
});

module.exports = {
  serviceSchema,
  serviceUpdateSchema
};

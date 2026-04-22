const Joi = require('joi');

const testimonialSchema = Joi.object({
  name: Joi.string().required(),
  company: Joi.string().allow('', null).optional(),
  role: Joi.string().allow('', null).optional(),
  text: Joi.string().min(20).max(500).required(),
  rating: Joi.number().min(1).max(5).optional(),
  order: Joi.number().optional(),
  isActive: Joi.boolean().optional()
  // Avatar handled via multer
});

const testimonialUpdateSchema = Joi.object({
  name: Joi.string().optional(),
  company: Joi.string().allow('', null).optional(),
  role: Joi.string().allow('', null).optional(),
  text: Joi.string().min(20).max(500).optional(),
  rating: Joi.number().min(1).max(5).optional(),
  order: Joi.number().optional(),
  isActive: Joi.boolean().optional()
  // Avatar handled via multer
});

module.exports = {
  testimonialSchema,
  testimonialUpdateSchema
};

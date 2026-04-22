const Joi = require('joi');

const portfolioSchema = Joi.object({
  title: Joi.string().required(),
  category: Joi.string().required(),
  description: Joi.string().required(),
  tags: Joi.array().items(Joi.string()).optional(),
  clientName: Joi.string().allow('', null).optional(),
  projectUrl: Joi.string().uri().allow('', null).optional(),
  featured: Joi.boolean().default(false),
  order: Joi.number().optional(),
  isActive: Joi.boolean().optional()
  // Image is handled by multer
});

const portfolioUpdateSchema = Joi.object({
  title: Joi.string().optional(),
  category: Joi.string().optional(),
  description: Joi.string().optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  clientName: Joi.string().allow('', null).optional(),
  projectUrl: Joi.string().uri().allow('', null).optional(),
  featured: Joi.boolean().optional(),
  order: Joi.number().optional(),
  isActive: Joi.boolean().optional()
  // Image is handled by multer
});

module.exports = {
  portfolioSchema,
  portfolioUpdateSchema
};

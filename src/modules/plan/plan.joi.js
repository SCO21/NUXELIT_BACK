const Joi = require('joi');

const planSchema = Joi.object({
  name: Joi.string().required(),
  subtitle: Joi.string().allow('', null).optional(),
  price: Joi.string().required(),
  currency: Joi.string().default('COP').optional(),
  period: Joi.string().allow('', null).optional(),
  highlighted: Joi.boolean().default(false),
  badge: Joi.string().allow('', null).optional(),
  features: Joi.array().items(Joi.string()).min(1).required(),
  cta: Joi.string().required(),
  order: Joi.number().optional(),
  isActive: Joi.boolean().optional()
});

const planUpdateSchema = Joi.object({
  name: Joi.string().optional(),
  subtitle: Joi.string().allow('', null).optional(),
  price: Joi.string().optional(),
  currency: Joi.string().optional(),
  period: Joi.string().allow('', null).optional(),
  highlighted: Joi.boolean().optional(),
  badge: Joi.string().allow('', null).optional(),
  features: Joi.array().items(Joi.string()).min(1).optional(),
  cta: Joi.string().optional(),
  order: Joi.number().optional(),
  isActive: Joi.boolean().optional()
});

module.exports = {
  planSchema,
  planUpdateSchema
};

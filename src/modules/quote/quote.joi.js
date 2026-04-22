const Joi = require('joi');
const { QUOTE_STATUS } = require('../../utils/constants');

const quoteSchema = Joi.object({
  serviceType: Joi.string().required(),
  projectDescription: Joi.string().max(5000).allow('', null).optional(),
  budget: Joi.string().allow('', null).optional(),
  timeline: Joi.string().allow('', null).optional(),
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().allow('', null).optional(),
  company: Joi.string().max(200).allow('', null).optional()
});

const quoteUpdateSchema = Joi.object({
  status: Joi.string().valid(...Object.values(QUOTE_STATUS)).optional(),
  quotedAmount: Joi.number().optional(),
  internalNotes: Joi.string().allow('', null).optional(),
  assignedTo: Joi.string().allow('', null).optional()
});

module.exports = {
  quoteSchema,
  quoteUpdateSchema
};

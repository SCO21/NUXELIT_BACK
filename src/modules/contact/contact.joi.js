const Joi = require('joi');
const { CONTACT_STATUS } = require('../../utils/constants');

const contactSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().min(7).max(20).optional(),
  service: Joi.string().optional(),
  message: Joi.string().min(10).max(2000).required()
});

const statusUpdateSchema = Joi.object({
  status: Joi.string().valid(...Object.values(CONTACT_STATUS)).required(),
  notes: Joi.string().optional()
});

module.exports = {
  contactSchema,
  statusUpdateSchema
};

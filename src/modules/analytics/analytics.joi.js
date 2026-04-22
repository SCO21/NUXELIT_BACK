const Joi = require('joi');

const eventSchema = Joi.object({
  event: Joi.string().required(),
  page: Joi.string().allow('', null).optional(),
  sessionId: Joi.string().allow('', null).optional(),
  metadata: Joi.object().optional()
});

module.exports = {
  eventSchema
};

const Joi = require('joi');

const sessionSchema = Joi.object({
  language: Joi.string().default('es').optional()
});

const messageSchema = Joi.object({
  sessionId: Joi.string().uuid().required(),
  message: Joi.string().min(1).max(1000).required()
});

const feedbackSchema = Joi.object({
  sessionId: Joi.string().required(), // allowing non-uuid strictly here for backward comp if needed, but required
  messageIndex: Joi.number().required(),
  rating: Joi.string().valid('positive', 'negative').required(),
  comment: Joi.string().allow('', null).optional()
});

module.exports = {
  sessionSchema,
  messageSchema,
  feedbackSchema
};

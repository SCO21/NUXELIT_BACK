const express = require('express');
const router = express.Router();
const chatbotController = require('./chatbot.controller');
const { protect, authorize } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const { sessionSchema, messageSchema, feedbackSchema } = require('./chatbot.joi');
const { chatbotMsg } = require('../../middleware/rateLimiter');
const { ROLES } = require('../../utils/constants');

router.post('/session', validate(sessionSchema), chatbotController.createSession);
router.post('/message', chatbotMsg, validate(messageSchema), chatbotController.processMessage);
router.get('/session/:sessionId', chatbotController.getSessionHistory);
router.post('/feedback', validate(feedbackSchema), chatbotController.sendFeedback);

router.get('/conversations', protect, authorize(ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.EDITOR), chatbotController.getConversations);

module.exports = router;

const express = require('express');
const router = express.Router();
const newsletterController = require('./newsletter.controller');
const { protect, authorize } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const { subscribeSchema } = require('./newsletter.joi');
const { ROLES } = require('../../utils/constants');

router.post('/subscribe', validate(subscribeSchema), newsletterController.subscribe);
router.post('/unsubscribe', validate(subscribeSchema), newsletterController.unsubscribe);

router.get('/subscribers', protect, authorize(ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.EDITOR), newsletterController.getSubscribers);

module.exports = router;

const express = require('express');
const router = express.Router();
const analyticsController = require('./analytics.controller');
const { protect, authorize } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const { eventSchema } = require('./analytics.joi');
const { analytics } = require('../../middleware/rateLimiter');
const { ROLES } = require('../../utils/constants');

router.post('/event', analytics, validate(eventSchema), analyticsController.registerEvent);

router.use(protect);
router.get('/dashboard', authorize(ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.EDITOR), analyticsController.getDashboard);

module.exports = router;

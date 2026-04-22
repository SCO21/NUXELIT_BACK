const express = require('express');
const router = express.Router();
const adminController = require('./admin.controller');
const { protect, authorize } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const { loginSchema, registerSchema, refreshSchema, profileUpdateSchema } = require('./admin.joi');
const { adminLogin } = require('../../middleware/rateLimiter');
const { ROLES } = require('../../utils/constants');

router.post('/login', adminLogin, validate(loginSchema), adminController.login);
router.post('/refresh', validate(refreshSchema), adminController.refresh);

// Protected routes
router.use(protect);

router.post('/register', authorize(ROLES.SUPERADMIN), validate(registerSchema), adminController.register);
router.route('/profile')
  .get(adminController.getProfile)
  .put(validate(profileUpdateSchema), adminController.updateProfile);

module.exports = router;

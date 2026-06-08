const express = require('express');
const router = express.Router();
const adminController = require('./admin.controller');
const { protect } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const { loginSchema } = require('./admin.joi');
const { adminLogin } = require('../../middleware/rateLimiter');

// Public routes (Authentication flow)
router.post('/login', adminLogin, validate(loginSchema), adminController.login);
router.post('/verify-totp', adminController.verifyTOTP);
router.post('/setup-totp', adminController.setupTOTP);
router.post('/refresh', adminController.refresh);
router.post('/logout', adminController.logout);

// Protected routes (Requires valid Access Token)
router.use(protect);

router.post('/logout-global', adminController.logoutGlobal);
router.get('/audit-logs', adminController.getAuditLogs);

module.exports = router;

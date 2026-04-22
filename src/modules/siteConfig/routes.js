const express = require('express');
const router = express.Router();
const siteConfigController = require('./siteConfig.controller');
const { protect, authorize } = require('../../middleware/auth');
const { ROLES } = require('../../utils/constants');
// validation could be added if needed, but the spec allows an open object structure for deep merge

router.get('/', siteConfigController.getConfig);
router.put('/', protect, authorize(ROLES.SUPERADMIN), siteConfigController.updateConfig);

module.exports = router;

const express = require('express');
const router = express.Router();
const contactController = require('./contact.controller');
const { protect, authorize } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const { contactSchema, statusUpdateSchema } = require('./contact.joi');
const { strict } = require('../../middleware/rateLimiter');
const { ROLES } = require('../../utils/constants');

router.post('/', strict, validate(contactSchema), contactController.createContact);

router.use(protect);
router.get('/', authorize(ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.EDITOR), contactController.getContacts);
router.put('/:id/status', authorize(ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.EDITOR), validate(statusUpdateSchema), contactController.updateStatus);
router.delete('/:id', authorize(ROLES.SUPERADMIN, ROLES.ADMIN), contactController.deleteContact);

module.exports = router;

const express = require('express');
const router = express.Router();
const serviceController = require('./service.controller');
const { protect, authorize } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const { serviceSchema, serviceUpdateSchema } = require('./service.joi');
const upload = require('../../middleware/upload');
const { ROLES } = require('../../utils/constants');

router.get('/', serviceController.getServices);

router.use(protect);
router.post('/', authorize(ROLES.SUPERADMIN, ROLES.ADMIN), upload.single('image'), validate(serviceSchema), serviceController.createService);
router.put('/:id', authorize(ROLES.SUPERADMIN, ROLES.ADMIN), upload.single('image'), validate(serviceUpdateSchema), serviceController.updateService);
router.delete('/:id', authorize(ROLES.SUPERADMIN, ROLES.ADMIN), serviceController.deleteService);

module.exports = router;

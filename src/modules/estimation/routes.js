const express = require('express');
const router = express.Router();
const estimationController = require('./estimation.controller');
const { protect, authorize } = require('../../middleware/auth');
const upload = require('../../middleware/upload');
const { ROLES } = require('../../utils/constants');

// Auth middlewares commented out temporarily for local testing, matching project/routes.js pattern
// router.use(protect);
// router.use(authorize(ROLES.SUPERADMIN, ROLES.ADMIN));

router.get('/', estimationController.getEstimations);
router.get('/stats', estimationController.getEstimationStats);
router.get('/catalog', estimationController.getCatalog);
router.put('/catalog', estimationController.updateCatalog);
router.post('/catalog/import', estimationController.importCatalog);

router.get('/:id', estimationController.getEstimationById);
router.post('/', estimationController.createEstimation);
router.put('/:id', estimationController.updateEstimation);
router.patch('/:id/status', estimationController.updateEstimationStatus);
router.post('/:id/duplicate', estimationController.duplicateEstimation);
router.delete('/:id', estimationController.deleteEstimation);

router.get('/:id/render-html', estimationController.renderEstimationHtml);
router.post('/:id/images', upload.single('image'), estimationController.addArchitectureImage);
router.delete('/:id/images/:index', estimationController.removeArchitectureImage);

module.exports = router;

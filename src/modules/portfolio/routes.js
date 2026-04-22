const express = require('express');
const router = express.Router();
const portfolioController = require('./portfolio.controller');
const { protect, authorize } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const { portfolioSchema, portfolioUpdateSchema } = require('./portfolio.joi');
const upload = require('../../middleware/upload');
const { ROLES } = require('../../utils/constants');

router.get('/', portfolioController.getPortfolios);

router.use(protect);
router.post('/', authorize(ROLES.SUPERADMIN, ROLES.ADMIN), upload.single('image'), validate(portfolioSchema), portfolioController.createPortfolio);
router.put('/:id', authorize(ROLES.SUPERADMIN, ROLES.ADMIN), upload.single('image'), validate(portfolioUpdateSchema), portfolioController.updatePortfolio);
router.delete('/:id', authorize(ROLES.SUPERADMIN, ROLES.ADMIN), portfolioController.deletePortfolio);

module.exports = router;

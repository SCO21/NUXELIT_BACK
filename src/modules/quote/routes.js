const express = require('express');
const router = express.Router();
const quoteController = require('./quote.controller');
const { protect, authorize } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const { quoteSchema, quoteUpdateSchema } = require('./quote.joi');
const { strict } = require('../../middleware/rateLimiter');
const { ROLES } = require('../../utils/constants');

router.post('/', strict, validate(quoteSchema), quoteController.createQuote);

router.use(protect);
router.get('/', authorize(ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.EDITOR), quoteController.getQuotes);
router.get('/:id', authorize(ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.EDITOR), quoteController.getQuoteById);
router.put('/:id', authorize(ROLES.SUPERADMIN, ROLES.ADMIN), validate(quoteUpdateSchema), quoteController.updateQuote);
router.delete('/:id', authorize(ROLES.SUPERADMIN, ROLES.ADMIN), quoteController.deleteQuote);

module.exports = router;

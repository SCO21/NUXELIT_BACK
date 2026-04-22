const express = require('express');
const router = express.Router();
const planController = require('./plan.controller');
const { protect, authorize } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const { planSchema, planUpdateSchema } = require('./plan.joi');
const { ROLES } = require('../../utils/constants');

router.get('/', planController.getPlans);

router.use(protect);
router.post('/', authorize(ROLES.SUPERADMIN, ROLES.ADMIN), validate(planSchema), planController.createPlan);
router.put('/:id', authorize(ROLES.SUPERADMIN, ROLES.ADMIN), validate(planUpdateSchema), planController.updatePlan);
router.delete('/:id', authorize(ROLES.SUPERADMIN, ROLES.ADMIN), planController.deletePlan);

module.exports = router;

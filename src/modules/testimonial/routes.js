const express = require('express');
const router = express.Router();
const testimonialController = require('./testimonial.controller');
const { protect, authorize } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const { testimonialSchema, testimonialUpdateSchema } = require('./testimonial.joi');
const upload = require('../../middleware/upload');
const { ROLES } = require('../../utils/constants');

router.get('/', testimonialController.getTestimonials);

router.use(protect);
router.post('/', authorize(ROLES.SUPERADMIN, ROLES.ADMIN), upload.single('avatar'), validate(testimonialSchema), testimonialController.createTestimonial);
router.put('/:id', authorize(ROLES.SUPERADMIN, ROLES.ADMIN), upload.single('avatar'), validate(testimonialUpdateSchema), testimonialController.updateTestimonial);
router.delete('/:id', authorize(ROLES.SUPERADMIN, ROLES.ADMIN), testimonialController.deleteTestimonial);

module.exports = router;

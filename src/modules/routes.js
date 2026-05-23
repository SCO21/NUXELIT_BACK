const express = require('express');
const router = express.Router();

const adminRoutes = require('./admin/routes');
const siteConfigRoutes = require('./siteConfig/routes');
const contactRoutes = require('./contact/routes');
const newsletterRoutes = require('./newsletter/routes');
const planRoutes = require('./plan/routes');
const serviceRoutes = require('./service/routes');
const portfolioRoutes = require('./portfolio/routes');
const testimonialRoutes = require('./testimonial/routes');
const quoteRoutes = require('./quote/routes');
const chatbotRoutes = require('./chatbot/routes');
const analyticsRoutes = require('./analytics/routes');
const developerRoutes = require('./developer/routes');
const projectRoutes = require('./project/routes');
const estimationRoutes = require('./estimation/routes');

router.use('/admin', adminRoutes);
router.use('/site-config', siteConfigRoutes);
router.use('/contact', contactRoutes);
router.use('/newsletter', newsletterRoutes);
router.use('/plans', planRoutes);
router.use('/services', serviceRoutes);
router.use('/portfolio', portfolioRoutes);
router.use('/testimonials', testimonialRoutes);
router.use('/quotes', quoteRoutes);
router.use('/chatbot', chatbotRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/developers', developerRoutes);
router.use('/projects', projectRoutes);
router.use('/estimations', estimationRoutes);

module.exports = router;


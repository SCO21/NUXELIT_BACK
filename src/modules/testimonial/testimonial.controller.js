const testimonialService = require('./testimonial.service');
const { successResponse, errorResponse } = require('../../utils/responseHelper');

const getTestimonials = async (req, res, next) => {
  try {
    const testimonials = await testimonialService.getTestimonials(req.query);
    return successResponse(res, { testimonials }, 'Testimonios obtenidos');
  } catch (error) {
    next(error);
  }
};

const createTestimonial = async (req, res, next) => {
  try {
    const testimonial = await testimonialService.createTestimonial(req.body, req.file);
    return successResponse(res, testimonial, 'Testimonio creado exitosamente', 201);
  } catch (error) {
    next(error);
  }
};

const updateTestimonial = async (req, res, next) => {
  try {
    const testimonial = await testimonialService.updateTestimonial(req.params.id, req.body, req.file);
    return successResponse(res, testimonial, 'Testimonio actualizado');
  } catch (error) {
    if (error.message === 'Testimonio no encontrado') return errorResponse(res, error.message, 404);
    next(error);
  }
};

const deleteTestimonial = async (req, res, next) => {
  try {
    await testimonialService.deleteTestimonial(req.params.id);
    return successResponse(res, null, 'Testimonio eliminado');
  } catch (error) {
    if (error.message === 'Testimonio no encontrado') return errorResponse(res, error.message, 404);
    next(error);
  }
};

module.exports = {
  getTestimonials,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial
};

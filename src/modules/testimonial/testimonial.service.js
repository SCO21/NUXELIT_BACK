const Testimonial = require('./testimonial.model');
const { uploadImage, deleteImage } = require('../../utils/storageService');

const getTestimonials = async (query) => {
  const filter = {};
  if (query.active !== 'false') {
    filter.isActive = true;
  }
  return await Testimonial.find(filter).sort({ order: 1, createdAt: -1 });
};

const createTestimonial = async (testimonialData, file) => {
  let avatarUrl = null;
  if (file) {
    avatarUrl = await uploadImage(file.buffer, 'testimonials');
  }

  const data = { ...testimonialData };
  if (avatarUrl) data.avatar = avatarUrl;

  return await Testimonial.create(data);
};

const updateTestimonial = async (id, testimonialData, file) => {
  const testimonial = await Testimonial.findById(id);
  if (!testimonial) {
    throw new Error('Testimonio no encontrado');
  }

  let avatarUrl = testimonial.avatar;
  if (file) {
    if (avatarUrl) {
      await deleteImage(avatarUrl);
    }
    avatarUrl = await uploadImage(file.buffer, 'testimonials');
  }

  const data = { ...testimonialData };
  if (file) data.avatar = avatarUrl;

  Object.assign(testimonial, data);
  await testimonial.save();
  return testimonial;
};

const deleteTestimonial = async (id) => {
  const testimonial = await Testimonial.findById(id);
  if (!testimonial) {
    throw new Error('Testimonio no encontrado');
  }

  if (testimonial.avatar) {
    await deleteImage(testimonial.avatar);
  }

  await Testimonial.findByIdAndDelete(id);
  return;
};

module.exports = {
  getTestimonials,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial
};

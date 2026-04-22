const Service = require('./service.model');
const { uploadImage, deleteImage } = require('../../utils/storageService');

const getServices = async (query) => {
  const filter = {};
  if (query.active !== 'false') {
    filter.isActive = true;
  }
  return await Service.find(filter).sort({ order: 1 });
};

const createService = async (serviceData, file) => {
  let imageUrl = null;
  if (file) {
    imageUrl = await uploadImage(file.buffer, 'services');
  }

  const data = { ...serviceData };
  if (imageUrl) data.image = imageUrl;

  return await Service.create(data);
};

const updateService = async (id, serviceData, file) => {
  const service = await Service.findById(id);
  if (!service) {
    throw new Error('Servicio no encontrado');
  }

  let imageUrl = service.image;
  if (file) {
    if (imageUrl) {
      await deleteImage(imageUrl);
    }
    imageUrl = await uploadImage(file.buffer, 'services');
  }

  const data = { ...serviceData };
  if (file) data.image = imageUrl;

  Object.assign(service, data);
  await service.save();
  return service;
};

const deleteService = async (id) => {
  const service = await Service.findById(id);
  if (!service) {
    throw new Error('Servicio no encontrado');
  }

  if (service.image) {
    await deleteImage(service.image);
  }

  await Service.findByIdAndDelete(id);
  return;
};

module.exports = {
  getServices,
  createService,
  updateService,
  deleteService
};

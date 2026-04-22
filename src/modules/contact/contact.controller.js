const contactService = require('./contact.service');
const { successResponse, errorResponse } = require('../../utils/responseHelper');
const { getPagination } = require('../../utils/pagination');

const createContact = async (req, res, next) => {
  try {
    const result = await contactService.createContact(req.body);
    return successResponse(res, result, 'Contacto registrado exitosamente', 201);
  } catch (error) {
    next(error);
  }
};

const getContacts = async (req, res, next) => {
  try {
    const result = await contactService.getContacts(req.query, getPagination(req.query));
    return successResponse(res, result, 'Contactos obtenidos');
  } catch (error) {
    next(error);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const contact = await contactService.updateStatus(req.params.id, req.body);
    return successResponse(res, contact, 'Estado actualizado');
  } catch (error) {
    if (error.message === 'Contacto no encontrado') {
      return errorResponse(res, error.message, 404);
    }
    next(error);
  }
};

const deleteContact = async (req, res, next) => {
  try {
    await contactService.deleteContact(req.params.id);
    return successResponse(res, null, 'Contacto eliminado');
  } catch (error) {
    if (error.message === 'Contacto no encontrado') {
      return errorResponse(res, error.message, 404);
    }
    next(error);
  }
};

module.exports = {
  createContact,
  getContacts,
  updateStatus,
  deleteContact
};

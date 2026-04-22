const Contact = require('./contact.model');
const { getPaginationData } = require('../../utils/pagination');

const createContact = async (contactData) => {
  const contact = await Contact.create(contactData);
  // Email logic can be added here using emailService
  return { id: contact._id, message: 'Tu mensaje ha sido recibido. Te contactaremos pronto.' };
};

const getContacts = async (query, pagination) => {
  const { page, limit, skip } = pagination;
  const filter = {};
  
  if (query.status) filter.status = query.status;
  if (query.search) {
    filter.$or = [
      { name: { $regex: query.search, $options: 'i' } },
      { email: { $regex: query.search, $options: 'i' } }
    ];
  }

  const sort = {};
  if (query.sortBy) {
    sort[query.sortBy] = query.order === 'asc' ? 1 : -1;
  } else {
    sort.createdAt = -1;
  }

  const contacts = await Contact.find(filter).sort(sort).skip(skip).limit(limit);
  const total = await Contact.countDocuments(filter);

  return {
    contacts,
    pagination: getPaginationData(total, page, limit)
  };
};

const updateStatus = async (id, statusData) => {
  const contact = await Contact.findByIdAndUpdate(id, statusData, { new: true, runValidators: true });
  if (!contact) {
    throw new Error('Contacto no encontrado');
  }
  return contact;
};

const deleteContact = async (id) => {
  const contact = await Contact.findByIdAndDelete(id);
  if (!contact) {
    throw new Error('Contacto no encontrado');
  }
  return;
};

module.exports = {
  createContact,
  getContacts,
  updateStatus,
  deleteContact
};

const mongoose = require('mongoose');
const { CONTACT_STATUS } = require('../../utils/constants');

const contactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
  },
  service: {
    type: String,
  },
  message: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: Object.values(CONTACT_STATUS),
    default: CONTACT_STATUS.NEW
  },
  notes: {
    type: String,
  },
  source: {
    type: String,
    default: 'website'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Contact', contactSchema);

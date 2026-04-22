const mongoose = require('mongoose');
const { QUOTE_STATUS } = require('../../utils/constants');

const quoteSchema = new mongoose.Schema({
  quoteNumber: {
    type: String,
    unique: true
  },
  serviceType: {
    type: String,
    required: true
  },
  projectDescription: {
    type: String
  },
  budget: {
    type: String
  },
  timeline: {
    type: String
  },
  client: {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    phone: {
      type: String
    },
    company: {
      type: String
    }
  },
  status: {
    type: String,
    enum: Object.values(QUOTE_STATUS),
    default: QUOTE_STATUS.PENDING
  },
  internalNotes: {
    type: String
  },
  quotedAmount: {
    type: Number
  },
  assignedTo: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Quote', quoteSchema);

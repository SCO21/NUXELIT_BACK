const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  subtitle: {
    type: String
  },
  price: {
    type: String,
    required: true
  },
  currency: {
    type: String,
    default: 'COP'
  },
  period: {
    type: String
  },
  highlighted: {
    type: Boolean,
    default: false
  },
  badge: {
    type: String
  },
  features: [{
    type: String
  }],
  cta: {
    type: String,
    required: true
  },
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Plan', planSchema);

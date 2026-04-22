const mongoose = require('mongoose');

const analyticsEventSchema = new mongoose.Schema({
  event: {
    type: String,
    required: true
  },
  page: {
    type: String
  },
  sessionId: {
    type: String
  },
  userAgent: {
    type: String
  },
  ip: {
    type: String
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: { createdAt: true, updatedAt: false } // only createdAt needed
});

module.exports = mongoose.model('AnalyticsEvent', analyticsEventSchema);

const mongoose = require('mongoose');

const siteConfigSchema = new mongoose.Schema({
  key: {
    type: String,
    unique: true,
    required: true,
    default: 'main'
  },
  company: {
    name: String,
    tagline: String,
    description: String,
    logo: String,
    foundedYear: Number
  },
  theme: {
    primary: String,
    secondary: String,
    accent: String,
    background: String,
    text: String
  },
  contact: {
    email: String,
    phone: String,
    whatsapp: String,
    whatsappMessage: String,
    address: String,
    social: {
      linkedin: String,
      github: String,
      twitter: String,
      instagram: String,
      youtube: String
    }
  },
  navigation: [{
    label: String,
    href: String
  }],
  stats: [{
    label: String,
    value: String,
    suffix: String
  }],
  techStack: [String],
  quoteOptions: {
    serviceTypes: [String],
    budgetRanges: [String],
    timelines: [String]
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('SiteConfig', siteConfigSchema);

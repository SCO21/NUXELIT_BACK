const SiteConfig = require('./siteConfig.model');

const getDefaultConfig = () => ({
  key: 'main',
  company: {
    name: 'Nuxelit',
    tagline: 'Construimos el futuro digital',
    description: 'Empresa especializada en desarrollo.',
    logo: '',
    foundedYear: 2026
  },
  theme: {
    primary: '#6C3CE1',
    secondary: '#0EA5E9',
  },
  contact: {
    email: 'contacto@nuxelit.com',
    phone: '',
    whatsapp: '',
    whatsappMessage: '',
    address: '',
    social: {}
  },
  navigation: [],
  stats: [],
  techStack: [],
  quoteOptions: {
    serviceTypes: [],
    budgetRanges: [],
    timelines: []
  }
});

const getConfig = async () => {
  let config = await SiteConfig.findOne({ key: 'main' });
  if (!config) {
    config = await SiteConfig.create(getDefaultConfig());
  }
  return config;
};

const updateConfig = async (updateData) => {
  let config = await SiteConfig.findOne({ key: 'main' });
  if (!config) {
    config = new SiteConfig({ key: 'main' });
  }

  // Deep merge strategy could be implemented, using dot notation or Object assign logic for subdocuments
  // Since it's mongoose, setting values updates them, but we need to iterate over nested objects properly
  for (const [key, value] of Object.entries(updateData)) {
    if (typeof value === 'object' && !Array.isArray(value)) {
      if (!config[key]) config[key] = {};
      for (const [nestedKey, nestedValue] of Object.entries(value)) {
        config[key][nestedKey] = nestedValue;
      }
    } else {
      config[key] = value;
    }
  }

  await config.save();
  return config;
};

module.exports = {
  getConfig,
  updateConfig
};

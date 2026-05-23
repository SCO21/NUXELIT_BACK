const mongoose = require('mongoose');

const CatalogActivitySchema = new mongoose.Schema({
  code: { type: String, required: true },
  name: { type: String, required: true },
  phase: { type: String, required: true },
  description: { type: String },
  type: { type: String },
  role: { type: String },
  complexity: { type: String },
  baseHours: { type: Number, default: 0 },
  riskPercent: { type: Number, default: 0 },
  dependency: { type: String },
  active: { type: Boolean, default: true }
});

const CatalogPlanActivitySchema = new mongoose.Schema({
  activityName: { type: String, required: true },
  quantity: { type: Number, default: 1 },
  order: { type: Number, default: 0 },
  role: { type: String },
  baseHours: { type: Number },
  description: { type: String }
});

const CatalogPlanSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String },
  type: { type: String },
  idealFor: { type: String },
  description: { type: String },
  includes: { type: String },
  observations: { type: String },
  activities: [CatalogPlanActivitySchema]
});

const CatalogPackageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String },
  category: { type: String },
  description: { type: String },
  includes: { type: String },
  activities: [CatalogPlanActivitySchema]
});

const CatalogConfigSchema = new mongoose.Schema({
  // General Configurations
  general: {
    hoursPerDayDefault: { type: Number, default: 8 },
    currencyDefault: { type: String, default: 'COP' },
    riskGlobalDefault: { type: Number, default: 0.10 },
    allowArchitectureImages: { type: Boolean, default: true },
    allowCostEstimation: { type: Boolean, default: true },
    allowObservations: { type: Boolean, default: true },
    allowVersioning: { type: Boolean, default: true },
    allowPdfDownload: { type: Boolean, default: true },
    allowExcelUpload: { type: Boolean, default: true },
    allowManualCreation: { type: Boolean, default: true },
    allowConfigActivities: { type: Boolean, default: true },
    allowConfigPlans: { type: Boolean, default: true },
    allowConfigPackages: { type: Boolean, default: true },
    allowConfigRates: { type: Boolean, default: true }
  },
  // Sub-sections
  states: [{
    code: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String },
    order: { type: Number },
    active: { type: Boolean, default: true }
  }],
  priorities: [{
    code: { type: String, required: true },
    name: { type: String, required: true },
    factor: { type: Number, default: 1.00 }
  }],
  environments: [{
    code: { type: String, required: true },
    name: { type: String, required: true }
  }],
  currencies: [{
    code: { type: String, required: true },
    name: { type: String, required: true },
    symbol: { type: String },
    active: { type: Boolean, default: true }
  }],
  developmentTypes: [{
    code: { type: String, required: true },
    name: { type: String, required: true }
  }],
  complexities: [{
    code: { type: String, required: true },
    name: { type: String, required: true },
    factor: { type: Number, required: true },
    description: { type: String }
  }],
  roles: [{
    code: { type: String, required: true },
    role: { type: String, required: true },
    rate: { type: Number, required: true },
    description: { type: String },
    active: { type: Boolean, default: true }
  }],
  phases: [{
    code: { type: String, required: true },
    name: { type: String, required: true },
    order: { type: Number }
  }],
  pdfSections: [{
    code: { type: String, required: true },
    name: { type: String, required: true },
    required: { type: Boolean, default: true },
    order: { type: Number }
  }],
  permissions: [{
    code: { type: String, required: true },
    name: { type: String, required: true }
  }]
});

const EstimationCatalogSchema = new mongoose.Schema({
  activities: [CatalogActivitySchema],
  plans: [CatalogPlanSchema],
  packages: [CatalogPackageSchema],
  config: CatalogConfigSchema
}, {
  timestamps: true
});

EstimationCatalogSchema.statics.getOrCreate = async function() {
  let doc = await this.findOne();
  if (!doc) {
    // Create an empty structure with defaults
    doc = await this.create({
      activities: [],
      plans: [],
      packages: [],
      config: {
        general: {
          hoursPerDayDefault: 8,
          currencyDefault: 'COP',
          riskGlobalDefault: 0.10,
          allowArchitectureImages: true,
          allowCostEstimation: true,
          allowObservations: true,
          allowVersioning: true,
          allowPdfDownload: true,
          allowExcelUpload: true,
          allowManualCreation: true,
          allowConfigActivities: true,
          allowConfigPlans: true,
          allowConfigPackages: true,
          allowConfigRates: true
        },
        states: [
          { code: 'PENDIENTE', name: 'Pendiente', description: 'Estimación creada o cargada, pendiente de revisión.', order: 1, active: true },
          { code: 'APROBADO', name: 'Aprobado', description: 'Estimación validada y aceptada.', order: 2, active: true },
          { code: 'RECHAZADO', name: 'Rechazado', description: 'Estimación revisada y no aceptada.', order: 3, active: true },
          { code: 'MODIFICADO', name: 'Modificado', description: 'Estimación ajustada después de una versión previa.', order: 4, active: true }
        ],
        priorities: [
          { code: 'BAJA', name: 'Baja', factor: 1.00 },
          { code: 'MEDIA', name: 'Media', factor: 1.00 },
          { code: 'ALTA', name: 'Alta', factor: 1.10 },
          { code: 'URGENTE', name: 'Urgente', factor: 1.25 }
        ],
        environments: [
          { code: 'LOCAL', name: 'Local' },
          { code: 'DEV', name: 'Dev' },
          { code: 'QA', name: 'QA' },
          { code: 'STAGE', name: 'Stage' },
          { code: 'PROD', name: 'Producción' }
        ],
        currencies: [
          { code: 'COP', name: 'Peso colombiano', symbol: '$', active: true },
          { code: 'USD', name: 'Dólar estadounidense', symbol: 'USD', active: true },
          { code: 'EUR', name: 'Euro', symbol: 'EUR', active: true }
        ],
        developmentTypes: [
          { code: 'LANDING_PAGE', name: 'Landing page' },
          { code: 'WEB_CORPORATIVA', name: 'Web corporativa' },
          { code: 'ECOMMERCE', name: 'E-commerce' },
          { code: 'PORTAL', name: 'Portal' },
          { code: 'APLICACION_WEB', name: 'Aplicación web' },
          { code: 'CUSTOM', name: 'Desarrollo a la medida' }
        ],
        complexities: [
          { code: 'BAJA', name: 'Baja', factor: 0.85, description: 'Actividad sencilla, con bajo nivel de incertidumbre.' },
          { code: 'MEDIA', name: 'Media', factor: 1.00, description: 'Actividad estándar, con alcance claro.' },
          { code: 'ALTA', name: 'Alta', factor: 1.30, description: 'Actividad con integración, lógica o mayor validación.' },
          { code: 'MUY_ALTA', name: 'Muy alta', factor: 1.60, description: 'Actividad con alta dependencia técnica o incertidumbre.' }
        ],
        roles: [
          { code: 'PM', role: 'PM', rate: 120000, description: 'Gestión del proyecto...', active: true },
          { code: 'ANALISTA', role: 'Analista', rate: 90000, description: 'Levantamiento, análisis...', active: true }
        ],
        phases: [
          { code: 'ENTENDIMIENTO', name: 'Entendimiento', order: 1 },
          { code: 'ANALISIS', name: 'Análisis', order: 2 }
        ],
        pdfSections: [],
        permissions: []
      }
    });
  }
  return doc;
};

module.exports = mongoose.model('EstimationCatalog', EstimationCatalogSchema);

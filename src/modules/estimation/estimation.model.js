const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema({
  origin: {
    type: String,
    enum: ['Plan', 'Paquete', 'Adicional'],
    required: true
  },
  phase: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String },
  type: { type: String },
  role: { type: String },
  complexity: { type: String },
  quantity: { type: Number, default: 1 },
  baseHours: { type: Number, default: 0 },
  factor: { type: Number, default: 1 },
  riskPercent: { type: Number, default: 0 },
  estimatedHours: { type: Number, default: 0 },
  days: { type: Number, default: 0 },
  dependency: { type: String }
});

const TotalByPhaseSchema = new mongoose.Schema({
  phase: { type: String, required: true },
  hours: { type: Number, default: 0 },
  percentage: { type: String, default: '0%' },
  roles: { type: String, default: '' }
});

const EstimationSchema = new mongoose.Schema({
  code: {
    type: String,
    unique: true,
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  version: {
    type: String,
    default: '1.0'
  },
  status: {
    type: String,
    enum: ['Pendiente', 'Aprobado', 'Rechazado', 'Modificado'],
    default: 'Pendiente'
  },
  client: {
    type: String,
    required: true
  },
  project: {
    type: String,
    required: true
  },
  responsible: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  planBase: { type: String },
  projectType: { type: String },
  environment: { type: String },
  priority: { type: String },
  scope: { type: String },
  assumptions: { type: String },
  currency: {
    type: String,
    default: 'COP'
  },
  hourlyRate: {
    type: Number,
    default: 0
  },
  hoursPerDay: {
    type: Number,
    default: 8
  },
  globalRisk: {
    type: Number,
    default: 0.10
  },
  summary: {
    subtotalHours: { type: Number, default: 0 },
    riskHours: { type: Number, default: 0 },
    totalHours: { type: Number, default: 0 },
    totalDays: { type: Number, default: 0 },
    weeks: { type: Number, default: 0 },
    estimatedCost: { type: Number, default: 0 },
    executiveNote: { type: String }
  },
  selectedPackages: [{ type: String }],
  activities: [ActivitySchema],
  totalsByPhase: [TotalByPhaseSchema],
  cost: {
    enabled: { type: Boolean, default: false },
    hourlyRate: { type: Number, default: 0 },
    currency: { type: String, default: 'COP' },
    subtotal: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    notes: { type: String }
  },
  architectureImages: [{
    url: { type: String, required: true },
    publicId: { type: String },
    title: { type: String },
    description: { type: String }
  }],
  notes: [{
    title: { type: String },
    description: { type: String }
  }],
  approval: {
    preparedBy: { type: String },
    approvedBy: { type: String }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }
}, {
  timestamps: true
});

EstimationSchema.index({ status: 1 });
EstimationSchema.index({ client: 1 });
EstimationSchema.index({ code: 1 });
EstimationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Estimation', EstimationSchema);

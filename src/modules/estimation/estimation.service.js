const Estimation = require('./estimation.model');
const EstimationCatalog = require('./catalog.model');
const { getPagination, getPaginationData } = require('../../utils/pagination');
const { renderTemplate } = require('../../utils/templateService');
const { uploadImage, deleteImage } = require('../../utils/storageService');
const logger = require('../../utils/logger');

// Generate unique sequential estimation code: EST-YYYY-NNNN
const generateEstimationCode = async () => {
  const year = new Date().getFullYear();
  const latestEst = await Estimation.findOne({ code: { $regex: `^EST-${year}-` } }).sort({ createdAt: -1 });

  let sequence = 1;
  if (latestEst) {
    const parts = latestEst.code.split('-');
    if (parts.length === 3) {
      sequence = parseInt(parts[2], 10) + 1;
    }
  }

  const paddedSequence = sequence.toString().padStart(4, '0');
  return `EST-${year}-${paddedSequence}`;
};

// Calculate summary metrics
const calculateSummary = (activities = [], globalRisk = 0.10, hoursPerDay = 8, hourlyRate = 0) => {
  let subtotalHours = 0;
  
  const processedActivities = activities.map(act => {
    const qty = Number(act.quantity) ?? 1;
    const base = Number(act.baseHours) ?? 0;
    const fact = Number(act.factor) ?? 1;
    const risk = Number(act.riskPercent) ?? 0;

    const estHours = Math.round((qty * base * fact * (1 + risk)) * 100) / 100;
    const days = Math.round((estHours / hoursPerDay) * 100) / 100;

    return {
      ...act,
      quantity: qty,
      baseHours: base,
      factor: fact,
      riskPercent: risk,
      estimatedHours: estHours,
      days: days
    };
  });

  processedActivities.forEach(act => {
    subtotalHours += act.estimatedHours;
  });

  subtotalHours = Math.round(subtotalHours * 100) / 100;
  const riskHours = Math.round((subtotalHours * globalRisk) * 100) / 100;
  const totalHours = Math.round((subtotalHours + riskHours) * 100) / 100;
  const totalDays = Math.round((totalHours / hoursPerDay) * 100) / 100;
  const weeks = Math.round((totalDays / 5) * 100) / 100;
  const estimatedCost = Math.round((totalHours * hourlyRate) * 100) / 100;

  return {
    activities: processedActivities,
    summary: {
      subtotalHours,
      riskHours,
      totalHours,
      totalDays,
      weeks,
      estimatedCost
    }
  };
};

// Group activities by phase and sum hours, calculate percentage share
const calculateTotalsByPhase = (activities = []) => {
  const phases = {};
  let totalHours = 0;

  activities.forEach(act => {
    const phase = act.phase || 'General';
    const hours = Number(act.estimatedHours) || 0;
    const role = act.role || '';

    if (!phases[phase]) {
      phases[phase] = { hours: 0, roles: new Set() };
    }

    phases[phase].hours += hours;
    totalHours += hours;
    if (role) {
      phases[phase].roles.add(role);
    }
  });

  return Object.entries(phases).map(([phase, data]) => {
    const hours = Math.round(data.hours * 100) / 100;
    const pct = totalHours > 0 ? Math.round((hours / totalHours) * 100) : 0;
    return {
      phase,
      hours,
      percentage: `${pct}%`,
      roles: Array.from(data.roles).filter(Boolean).join(', ')
    };
  });
};

// Validate basic estimation requirements
const validateEstimationData = (data) => {
  if (!data.title) throw new Error('El título es requerido');
  if (!data.client) throw new Error('El cliente es requerido');
  if (!data.project) throw new Error('El proyecto es requerido');
  if (!data.responsible) throw new Error('El responsable es requerido');
  if (data.hoursPerDay <= 0) throw new Error('Las horas por día deben ser mayores a 0');
  if (data.globalRisk < 0 || data.globalRisk > 1) throw new Error('El riesgo global debe estar entre 0 y 1');
  if (data.hourlyRate < 0) throw new Error('La tarifa por hora debe ser mayor o igual a 0');
};

// Create a new estimation
const createEstimation = async (data, createdBy) => {
  validateEstimationData(data);
  const code = await generateEstimationCode();
  
  const globalRisk = Number(data.globalRisk) ?? 0.10;
  const hoursPerDay = Number(data.hoursPerDay) ?? 8;
  const hourlyRate = Number(data.hourlyRate) ?? 0;

  const { activities, summary } = calculateSummary(data.activities || [], globalRisk, hoursPerDay, hourlyRate);
  const totalsByPhase = calculateTotalsByPhase(activities);

  // Default cost object if not present
  const cost = data.cost || {
    enabled: false,
    hourlyRate,
    currency: data.currency || 'COP',
    subtotal: summary.subtotalHours * hourlyRate,
    total: summary.estimatedCost,
    notes: ''
  };

  if (!data.cost) {
    cost.subtotal = summary.subtotalHours * cost.hourlyRate;
    cost.total = summary.totalHours * cost.hourlyRate;
  }

  const estimation = new Estimation({
    ...data,
    code,
    activities,
    summary,
    totalsByPhase,
    cost,
    createdBy
  });

  await estimation.save();
  return estimation;
};

// List estimations with filters
const getEstimations = async (query = {}, pagination = {}) => {
  const { page, limit, skip } = getPagination(pagination);
  const filter = {};

  if (query.search) {
    filter.$or = [
      { title: { $regex: query.search, $options: 'i' } },
      { client: { $regex: query.search, $options: 'i' } },
      { project: { $regex: query.search, $options: 'i' } }
    ];
  }

  if (query.status) {
    filter.status = query.status;
  }

  if (query.startDate || query.endDate) {
    filter.date = {};
    if (query.startDate) {
      filter.date.$gte = new Date(query.startDate);
    }
    if (query.endDate) {
      filter.date.$lte = new Date(query.endDate);
    }
  }

  const total = await Estimation.countDocuments(filter);
  const list = await Estimation.find(filter)
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return {
    list,
    pagination: getPaginationData(total, page, limit)
  };
};

// Retrieve a single estimation
const getEstimationById = async (id) => {
  const estimation = await Estimation.findById(id).populate('createdBy', 'name email');
  if (!estimation) {
    const error = new Error('Estimación no encontrada');
    error.status = 404;
    throw error;
  }
  return estimation;
};

// Update an estimation
const updateEstimation = async (id, data) => {
  validateEstimationData(data);
  const existing = await getEstimationById(id);

  const globalRisk = Number(data.globalRisk) ?? existing.globalRisk;
  const hoursPerDay = Number(data.hoursPerDay) ?? existing.hoursPerDay;
  const hourlyRate = Number(data.hourlyRate) ?? existing.hourlyRate;

  let activities = data.activities || existing.activities;
  let summary = data.summary;
  let totalsByPhase = data.totalsByPhase;
  let status = data.status || existing.status;

  // Recalculate if activities are passed in
  if (data.activities) {
    const calc = calculateSummary(activities, globalRisk, hoursPerDay, hourlyRate);
    activities = calc.activities;
    summary = calc.summary;
    totalsByPhase = calculateTotalsByPhase(activities);
    
    // As per requirement, update status to Modificado if activities changed and it wasn't explicitly changed to something else
    if (!data.status && existing.status !== 'Modificado') {
      status = 'Modificado';
    }
  } else {
    // If not recalculating activities but some values changed
    if (data.globalRisk !== undefined || data.hoursPerDay !== undefined || data.hourlyRate !== undefined) {
      const calc = calculateSummary(existing.activities, globalRisk, hoursPerDay, hourlyRate);
      activities = calc.activities;
      summary = calc.summary;
      totalsByPhase = calculateTotalsByPhase(activities);
    }
  }

  const cost = data.cost || existing.cost;
  if (data.cost) {
    cost.subtotal = (summary || existing.summary).subtotalHours * cost.hourlyRate;
    cost.total = (summary || existing.summary).totalHours * cost.hourlyRate;
  }

  const updated = await Estimation.findByIdAndUpdate(id, {
    ...data,
    status,
    activities,
    summary: summary || existing.summary,
    totalsByPhase: totalsByPhase || existing.totalsByPhase,
    cost
  }, { new: true });

  return updated;
};

// Update estimation status only
const updateEstimationStatus = async (id, status) => {
  const validStatuses = ['Pendiente', 'Aprobado', 'Rechazado', 'Modificado'];
  if (!validStatuses.includes(status)) {
    throw new Error('Estado inválido');
  }

  const updated = await Estimation.findByIdAndUpdate(id, { status }, { new: true });
  if (!updated) {
    const error = new Error('Estimación no encontrada');
    error.status = 404;
    throw error;
  }
  return updated;
};

// Delete estimation
const deleteEstimation = async (id) => {
  const deleted = await Estimation.findByIdAndDelete(id);
  if (!deleted) {
    const error = new Error('Estimación no encontrada');
    error.status = 404;
    throw error;
  }
  return deleted;
};

// Duplicate an estimation
const duplicateEstimation = async (id) => {
  const original = await getEstimationById(id);
  const plain = original.toObject();
  
  delete plain._id;
  delete plain.createdAt;
  delete plain.updatedAt;
  
  plain.code = await generateEstimationCode();
  plain.status = 'Pendiente';
  
  // Increment version
  const currentVersion = parseFloat(plain.version) || 1.0;
  plain.version = (currentVersion + 0.1).toFixed(1);

  const duplicate = new Estimation(plain);
  await duplicate.save();
  return duplicate;
};

// Get stats
const getEstimationStats = async () => {
  const result = await Estimation.aggregate([
    {
      $group: {
        _id: null,
        totalEstimations: { $sum: 1 },
        pending: { $sum: { $cond: [{ $eq: ['$status', 'Pendiente'] }, 1, 0] } },
        approved: { $sum: { $cond: [{ $eq: ['$status', 'Aprobado'] }, 1, 0] } },
        rejected: { $sum: { $cond: [{ $eq: ['$status', 'Rechazado'] }, 1, 0] } },
        modified: { $sum: { $cond: [{ $eq: ['$status', 'Modificado'] }, 1, 0] } },
        totalHours: { $sum: '$summary.totalHours' },
        avgHours: { $avg: '$summary.totalHours' },
        totalCost: { $sum: '$summary.estimatedCost' }
      }
    }
  ]);

  const stats = result[0] || {
    totalEstimations: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    modified: 0,
    totalHours: 0,
    avgHours: 0,
    totalCost: 0
  };

  return {
    totalEstimations: stats.totalEstimations,
    byStatus: {
      'Pendiente': stats.pending,
      'Aprobado': stats.approved,
      'Rechazado': stats.rejected,
      'Modificado': stats.modified
    },
    totalHoursEstimated: Math.round(stats.totalHours * 100) / 100,
    averageHours: Math.round(stats.avgHours * 100) / 100,
    totalCostEstimated: Math.round(stats.totalCost * 100) / 100
  };
};

// Render HTML
const renderEstimationHtml = async (id) => {
  const estimation = await getEstimationById(id);
  const plainEst = estimation.toObject();

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const formatCurrency = (val, curr = 'COP') => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: curr, minimumFractionDigits: 0 }).format(val);
  };

  const statusKeyMap = {
    'Pendiente': 'pendiente',
    'Aprobado': 'aprobado',
    'Rechazado': 'rechazado',
    'Modificado': 'modificado'
  };

  const data = {
    estimation: {
      title: plainEst.title,
      code: plainEst.code,
      date: formatDate(plainEst.date),
      version: plainEst.version,
      status: plainEst.status,
      statusKey: statusKeyMap[plainEst.status] || 'pendiente',
      responsible: plainEst.responsible
    },
    project: {
      name: plainEst.project,
      type: plainEst.projectType || 'No especificado',
      environment: plainEst.environment || 'No especificado',
      plan: plainEst.planBase || 'No especificado',
      priority: plainEst.priority || 'Media',
      scope: plainEst.scope || 'No especificado',
      assumptions: plainEst.assumptions || 'No especificado'
    },
    client: {
      name: plainEst.client
    },
    summary: {
      subtotalHours: plainEst.summary.subtotalHours,
      riskHours: plainEst.summary.riskHours,
      totalHours: plainEst.summary.totalHours,
      totalDays: plainEst.summary.totalDays,
      weeks: plainEst.summary.weeks,
      executiveNote: plainEst.summary.executiveNote || ''
    },
    cost: {
      enabled: plainEst.cost?.enabled || false,
      hourlyRate: formatCurrency(plainEst.cost?.hourlyRate || plainEst.hourlyRate, plainEst.cost?.currency || plainEst.currency),
      currency: plainEst.cost?.currency || plainEst.currency,
      subtotal: formatCurrency(plainEst.cost?.subtotal || (plainEst.summary.subtotalHours * plainEst.hourlyRate), plainEst.cost?.currency || plainEst.currency),
      total: formatCurrency(plainEst.cost?.total || plainEst.summary.estimatedCost, plainEst.cost?.currency || plainEst.currency),
      notes: plainEst.cost?.notes || ''
    },
    activities: plainEst.activities.map(act => ({
      ...act,
      estimatedHours: act.estimatedHours,
      days: act.days
    })),
    totalsByPhase: plainEst.totalsByPhase,
    architectureImages: plainEst.architectureImages || [],
    notes: plainEst.notes || [],
    approval: plainEst.approval || { preparedBy: '', approvedBy: '' },
    generatedAt: formatDate(new Date())
  };

  return renderTemplate('estimacion.html', data);
};

// Catalog managers
const getCatalog = async () => {
  return await EstimationCatalog.getOrCreate();
};

const updateCatalog = async (data) => {
  const catalog = await getCatalog();
  if (data.activities) catalog.activities = data.activities;
  if (data.plans) catalog.plans = data.plans;
  if (data.packages) catalog.packages = data.packages;
  if (data.config) catalog.config = data.config;

  await catalog.save();
  return catalog;
};

const importCatalogFromExcel = async (data) => {
  const catalog = await getCatalog();
  
  if (data.activities && Array.isArray(data.activities)) {
    catalog.activities = data.activities;
  }
  if (data.plans && Array.isArray(data.plans)) {
    catalog.plans = data.plans;
  }
  if (data.packages && Array.isArray(data.packages)) {
    catalog.packages = data.packages;
  }
  if (data.config) {
    catalog.config = {
      ...catalog.config,
      ...data.config
    };
  }

  await catalog.save();
  return catalog;
};

// Architecture images upload & delete
const addArchitectureImage = async (id, file) => {
  const estimation = await getEstimationById(id);
  
  // uploadImage mocks storing and returns URL
  const folder = `estimations/${estimation.code}`;
  const url = await uploadImage(file.buffer, folder);

  const newImage = {
    url,
    publicId: `${folder}/${Date.now()}`,
    title: file.originalname || 'Imagen de arquitectura',
    description: ''
  };

  estimation.architectureImages.push(newImage);
  await estimation.save();
  return estimation;
};

const removeArchitectureImage = async (id, imageIndex) => {
  const estimation = await getEstimationById(id);
  const idx = parseInt(imageIndex, 10);
  
  if (idx < 0 || idx >= estimation.architectureImages.length) {
    throw new Error('Index de imagen inválido');
  }

  const image = estimation.architectureImages[idx];
  if (image.publicId) {
    await deleteImage(image.url); // mocks deletion
  }

  estimation.architectureImages.splice(idx, 1);
  await estimation.save();
  return estimation;
};

module.exports = {
  createEstimation,
  getEstimations,
  getEstimationById,
  updateEstimation,
  updateEstimationStatus,
  deleteEstimation,
  duplicateEstimation,
  getEstimationStats,
  renderEstimationHtml,
  getCatalog,
  updateCatalog,
  importCatalogFromExcel,
  addArchitectureImage,
  removeArchitectureImage,
  calculateSummary,
  calculateTotalsByPhase
};

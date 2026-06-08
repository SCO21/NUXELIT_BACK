const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Opcional para logins fallidos con correos inexistentes
  },
  email: {
    type: String,
    required: false // Para registrar qué email intentó loguearse si no existe el userId
  },
  action: {
    type: String,
    required: [true, 'La acción es requerida']
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('AuditLog', auditLogSchema);

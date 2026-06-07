require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB } = require('../config/database');
const AuditLog = require('../modules/admin/auditLog.model');
const User = require('../modules/admin/user.model'); // Ensure User schema is loaded for populating

const run = async () => {
  try {
    console.log('=== BITÁCORA DE AUDITORÍA Y SEGURIDAD (Terminal) ===\n');
    
    await connectDB();
    
    const logs = await AuditLog.find()
      .populate('userId', 'name email')
      .sort({ timestamp: -1 })
      .limit(50);
      
    if (logs.length === 0) {
      console.log('No se encontraron registros de auditoría.');
      process.exit(0);
    }
    
    // Print logs
    logs.forEach(log => {
      const date = new Date(log.timestamp).toLocaleString();
      let userStr = 'Consola/Script';
      
      if (log.userId) {
        userStr = `${log.userId.name} (${log.userId.email})`;
      } else if (log.email) {
        userStr = log.email;
      }
      
      let actionColor = '\x1b[37m'; // White
      if (log.action.includes('SUCCESS') || log.action.includes('CREATED') || log.action.includes('ACTIVATED')) {
        actionColor = '\x1b[32m'; // Green
      } else if (log.action.includes('FAIL') || log.action.includes('BLOCKED') || log.action.includes('DEACTIVATED')) {
        actionColor = '\x1b[31m'; // Red
      } else if (log.action.includes('RESET') || log.action.includes('LOGOUT')) {
        actionColor = '\x1b[33m'; // Yellow
      }
      
      const actionStr = `${actionColor}${log.action}\x1b[0m`;
      const platform = log.userAgent.length > 30 ? log.userAgent.substring(0, 30) + '...' : log.userAgent;
      
      console.log(`[${date}] [${log.ipAddress}] ${actionStr}`);
      console.log(`  └─ Usuario: ${userStr}`);
      console.log(`  └─ Navegador: ${platform}`);
      console.log('----------------------------------------------------------------------');
    });
    
  } catch (error) {
    console.error('\n❌ Ocurrió un error:', error.message);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
};

run();

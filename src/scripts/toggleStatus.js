require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB } = require('../config/database');
const User = require('../modules/admin/user.model');
const { logAudit } = require('../utils/auditLogger');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve));

const run = async () => {
  try {
    console.log('=== ACTIVAR / DESACTIVAR CUENTA DE USUARIO ===\n');
    
    await connectDB();
    
    const email = (await askQuestion('Ingresa el correo electrónico del usuario: ')).trim().toLowerCase();
    if (!email) {
      console.log('\n❌ El correo es requerido.');
      process.exit(1);
    }
    
    const user = await User.findOne({ email });
    if (!user) {
      console.log(`\n❌ Error: No se encontró ningún usuario con el correo ${email}.`);
      process.exit(1);
    }
    
    console.log(`Usuario encontrado: ${user.name}`);
    console.log(`Estado actual: ${user.isActive ? 'ACTIVO (Puede iniciar sesión)' : 'INACTIVO (Bloqueado)'}`);
    
    const action = user.isActive ? 'desactivar' : 'activar';
    const confirm = (await askQuestion(`¿Estás seguro de que deseas ${action} la cuenta de ${user.email}? (s/n): `)).trim().toLowerCase();
    if (confirm !== 's' && confirm !== 'si') {
      console.log('\n❌ Operación cancelada.');
      process.exit(0);
    }
    
    user.isActive = !user.isActive;
    
    // If we are deactivating, clear their active sessions immediately (forced global logout)
    if (!user.isActive) {
      user.refreshTokens = [];
    }
    
    await user.save();
    
    await logAudit({
      userId: user._id,
      email: user.email,
      action: user.isActive ? 'USER_REACTIVATED_CLI' : 'USER_DEACTIVATED_CLI'
    });
    
    console.log(`\n✅ Cuenta ${user.isActive ? 'ACTIVADA' : 'DESACTIVADA'} con éxito para ${user.email}.`);
    if (!user.isActive) {
      console.log('Todas sus sesiones activas han sido cerradas.');
    }
    
  } catch (error) {
    console.error('\n❌ Ocurrió un error:', error.message);
  } finally {
    rl.close();
    mongoose.connection.close();
    process.exit(0);
  }
};

run();

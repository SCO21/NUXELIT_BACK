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
    console.log('=== RESTABLECER CONTRASEÑA DE USUARIO ===\n');
    
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
    
    const newPassword = await askQuestion('Ingresa la nueva contraseña (mínimo 8 caracteres): ');
    if (!newPassword || newPassword.length < 8) {
      console.log('\n❌ La contraseña debe tener al menos 8 caracteres.');
      process.exit(1);
    }
    
    user.passwordHash = newPassword; // Trigger pre-save hook for Argon2id hashing
    // Unlock account in case it was locked from failed attempts
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    
    await user.save();
    
    await logAudit({
      userId: user._id,
      email: user.email,
      action: 'PASSWORD_RESET_CLI'
    });
    
    console.log(`\n✅ Contraseña restablecida con éxito para ${user.email}. El bloqueo de intentos fallidos ha sido removido.`);
    
  } catch (error) {
    console.error('\n❌ Ocurrió un error:', error.message);
  } finally {
    rl.close();
    mongoose.connection.close();
    process.exit(0);
  }
};

run();

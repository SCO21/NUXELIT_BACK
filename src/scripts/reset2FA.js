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
    console.log('=== REINICIAR AUTENTICACIÓN DE 2 FACTORES (2FA) ===\n');
    
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
    console.log(`Estado de 2FA actual: ${user.twoFactorEnabled ? 'Habilitado' : 'Deshabilitado'}`);
    
    const confirm = (await askQuestion(`¿Estás seguro de que deseas reiniciar el 2FA para ${user.email}? (s/n): `)).trim().toLowerCase();
    if (confirm !== 's' && confirm !== 'si') {
      console.log('\n❌ Operación cancelada.');
      process.exit(0);
    }
    
    user.twoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    
    await user.save();
    
    await logAudit({
      userId: user._id,
      email: user.email,
      action: '2FA_RESET_CLI'
    });
    
    console.log(`\n✅ 2FA desactivado con éxito para ${user.email}.`);
    console.log('El usuario tendrá que volver a configurar su aplicación de autenticación (QR) en su próximo inicio de sesión.');
    
  } catch (error) {
    console.error('\n❌ Ocurrió un error:', error.message);
  } finally {
    rl.close();
    mongoose.connection.close();
    process.exit(0);
  }
};

run();

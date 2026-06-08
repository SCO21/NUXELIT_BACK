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
    console.log('=== CREACIÓN DE USUARIO ADMINISTRADOR ===\n');
    
    // Connect to database
    await connectDB();
    
    const name = (await askQuestion('Ingresa el nombre del usuario: ')).trim();
    if (!name) {
      console.log('\n❌ El nombre es requerido.');
      process.exit(1);
    }
    
    const email = (await askQuestion('Ingresa el correo electrónico: ')).trim().toLowerCase();
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!email || !emailRegex.test(email)) {
      console.log('\n❌ Por favor ingresa un correo electrónico válido.');
      process.exit(1);
    }
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log(`\n❌ Error: El usuario con correo ${email} ya existe.`);
      process.exit(1);
    }
    
    // Ask for password
    const password = await askQuestion('Ingresa la contraseña (mínimo 8 caracteres): ');
    if (!password || password.length < 8) {
      console.log('\n❌ La contraseña debe tener al menos 8 caracteres.');
      process.exit(1);
    }
    
    // Create user
    const newUser = await User.create({
      name,
      email,
      passwordHash: password, // Mongoose hook hashes this with Argon2id pre-save
      role: 'admin',
      isActive: true,
      twoFactorEnabled: false
    });
    
    // Log audit event
    await logAudit({
      userId: newUser._id,
      email: newUser.email,
      action: 'USER_CREATED_CLI'
    });
    
    console.log(`\n✅ Usuario creado con éxito!`);
    console.log(`- Nombre: ${newUser.name}`);
    console.log(`- Correo: ${newUser.email}`);
    console.log(`- Rol: ${newUser.role}`);
    console.log(`- Estado: Activo (Configurará 2FA en su primer inicio de sesión)\n`);
    
  } catch (error) {
    console.error('\n❌ Ocurrió un error:', error.message);
  } finally {
    rl.close();
    mongoose.connection.close();
    process.exit(0);
  }
};

run();

const mongoose = require('mongoose');
const argon2 = require('argon2');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Por favor ingresa un nombre'],
  },
  email: {
    type: String,
    required: [true, 'Por favor ingresa un correo'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Por favor ingresa un correo válido'
    ]
  },
  passwordHash: {
    type: String,
    required: [true, 'Por favor ingresa una contraseña'],
    select: false
  },
  role: {
    type: String,
    enum: ['admin'],
    default: 'admin'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  twoFactorSecret: {
    type: String,
    select: false
  },
  failedLoginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date
  },
  refreshTokens: [{
    tokenHash: {
      type: String,
      required: true
    },
    expiresAt: {
      type: Date,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
});

// Pre-save hook to hash password with Argon2id
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) {
    return next();
  }

  try {
    this.passwordHash = await argon2.hash(this.passwordHash, {
      type: argon2.argon2id,
      memoryCost: parseInt(process.env.ARGON2_MEMORY_COST, 10) || 65536,
      timeCost: parseInt(process.env.ARGON2_TIME_COST, 10) || 3,
      parallelism: parseInt(process.env.ARGON2_PARALLELISM, 10) || 4
    });
    next();
  } catch (err) {
    next(err);
  }
});

// Compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await argon2.verify(this.passwordHash, enteredPassword);
};

// Check if account is locked
userSchema.methods.isLocked = function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

module.exports = mongoose.model('User', userSchema);

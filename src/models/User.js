const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({

  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: [true, 'El tenantId es obligatorio']
  },

  name: {
    type: String,
    required: [true, 'El nombre es obligatorio'],
    trim: true
  },

  email: {
    type: String,
    required: [true, 'El email es obligatorio'],
    lowercase: true,
    trim: true
  },

  password: {
    type: String,
    required: [true, 'La contraseña es obligatorio'],
    select: false 
  },

  role: {
    type: String,
    enum: ['admin', 'customer'],
    required: [true, 'El rol es obligatorio']
  },

  isActive: {
    type: Boolean,
    default: true
  }

}, {timestamps: true});

// Esto es para especificar que el email es único por tenant, globalmente se puede repetir
userSchema.index({ tenantId: 1, email: 1 }, { unique: true });

// Hashear password
userSchema.pre('save', async function(next) {

  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Método para comparar contraseñas
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
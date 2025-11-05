const mongoose = require('mongoose');

/**
 * Modelo de Tenant (Inquilino)
 * Representa una empresa/organización que usa la plataforma
 */
const tenantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El nombre del tenant es requerido'],
    trim: true
  },
  slug: {
    type: String,
    required: [true, 'El slug es requerido'],
    lowercase: true,
    trim: true
  },
  email: {
    type: String,
    required: [true, 'El email es requerido'],
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Email inválido']
  },
  domain: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  settings: {
    currency: {
      type: String,
      default: 'USD'
    },
    timezone: {
      type: String,
      default: 'UTC'
    },
    language: {
      type: String,
      default: 'es'
    }
  }
}, {
  timestamps: true
});

// Índices para optimizar consultas
tenantSchema.index({ slug: 1 }, { unique: true });
tenantSchema.index({ email: 1 }, { unique: true });

module.exports = mongoose.model('Tenant', tenantSchema);


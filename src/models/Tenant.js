const mongoose = require('mongoose');

/**
 * Modelo de Tenant (Inquilino)
 * Representa una empresa/organización que usa la plataforma multi-tenant
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
    unique: true,
    lowercase: true,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Tenant', tenantSchema);


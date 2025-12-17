const mongoose = require('mongoose');
const Tenant = require('../models/Tenant');

const extractTenant = async (req, res, next) => {
  try {
    const tenantId = req.headers['x-tenant-id'];

    if (!tenantId) {
      return res.status(400).json({
        message: 'Falta el header x-tenant-id',
        statusCode: 400
      });
    }

    if (!mongoose.Types.ObjectId.isValid(tenantId)) {
      return res.status(400).json({
        message: 'El x-tenant-id no es un ObjectId válido',
        statusCode: 400
      });
    }

    const tenant = await Tenant.findById(tenantId);

    if (!tenant) {
      return res.status(404).json({
        message: 'Tenant no encontrado',
        statusCode: 404
      });
    }

    if (!tenant.isActive) {
      return res.status(403).json({
        message: 'Tenant inactivo',
        statusCode: 403
      });
    }
    
    req.tenant = tenant;
    req.tenantId = tenantId;

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  extractTenant
};


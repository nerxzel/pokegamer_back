const jwt = require('jsonwebtoken');
const config = require('../config/env');

const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'Token de autenticación no proporcionado',
        statusCode: 401
      });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        message: 'Token de autenticación no proporcionado',
        statusCode: 401
      });
    }

    const decoded = jwt.verify(token, config.JWT_SECRET);

    if (!decoded.userId || !decoded.tenantId || !decoded.role || !decoded.email) {
      return res.status(401).json({
        message: 'Token inválido: faltan datos del usuario',
        statusCode: 401
      });
    }

    req.user = {
      userId: decoded.userId,
      tenantId: decoded.tenantId,
      role: decoded.role,
      email: decoded.email
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        message: 'Token inválido',
        statusCode: 401
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        message: 'Token expirado',
        statusCode: 401
      });
    }

    next(error);
  }
};


const requireRole = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: 'Usuario no autenticado',
        statusCode: 401
      });
    }
    
    if (!rolesPermitidos.includes(req.user.role)) {
      return res.status(403).json({
        message: `Acceso denegado. Se requiere rol: ${rolesPermitidos.join(' o ')}`,
        statusCode: 403
      });
    }

    next();
  };
};

module.exports = {
  authenticate,
  requireRole
};


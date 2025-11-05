const jwt = require('jsonwebtoken');
const config = require('../config/env');

/**
 * Middleware de autenticación JWT
 * Verifica el token y extrae información del usuario
 */
const authenticate = (req, res, next) => {
  try {
    // 1. Leer el header Authorization
    const authHeader = req.headers.authorization;

    // 2. Verificar que existe y tiene el formato correcto
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'Token de autenticación no proporcionado',
        statusCode: 401
      });
    }

    // 3. Extraer el token
    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        message: 'Token de autenticación no proporcionado',
        statusCode: 401
      });
    }

    // 4. Verificar el token con JWT_SECRET
    const decoded = jwt.verify(token, config.JWT_SECRET);

    // 5. Extraer datos del usuario del token
    // El token debe contener: userId, tenantId, role, email
    if (!decoded.userId || !decoded.tenantId || !decoded.role || !decoded.email) {
      return res.status(401).json({
        message: 'Token inválido: faltan datos del usuario',
        statusCode: 401
      });
    }

    // 6. Guardar información del usuario en req.user
    req.user = {
      userId: decoded.userId,
      tenantId: decoded.tenantId,
      role: decoded.role,
      email: decoded.email
    };

    next();
  } catch (error) {
    // Manejar errores específicos de JWT
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

/**
 * Middleware helper de autorización por rol
 * Verifica que el usuario tenga uno de los roles permitidos
 * 
 * @param {...string} rolesPermitidos - Lista de roles permitidos
 * @returns {Function} Middleware de Express
 * 
 * @example
 * // Solo admins
 * router.get('/admin', authenticate, requireRole('admin'), handler);
 * 
 * // Admins o customers
 * router.get('/profile', authenticate, requireRole('admin', 'customer'), handler);
 */
const requireRole = (...rolesPermitidos) => {
  return (req, res, next) => {
    // Verificar que el usuario esté autenticado
    if (!req.user) {
      return res.status(401).json({
        message: 'Usuario no autenticado',
        statusCode: 401
      });
    }

    // Verificar que el rol del usuario esté en los roles permitidos
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


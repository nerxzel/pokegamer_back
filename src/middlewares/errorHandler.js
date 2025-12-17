
const errorHandler = (err, req, res, next) => {
  console.error('Error capturado:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || 'Error interno del servidor';
  let details = null;

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Errores de validación';
    details = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message
    }));
  }

  if (err.name === 'CastError') {
    statusCode = 400;
    message = `ID inválido: ${err.value}`;
  }

  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyPattern)[0];
    message = `El campo ${field} ya existe`;
  }

  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Token inválido';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expirado';
  }

  const response = {
    message,
    statusCode
  };

  if (details) {
    response.details = details;
  }

  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

module.exports = errorHandler;


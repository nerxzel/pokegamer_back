require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce-multitenant',
  
  JWT_SECRET: process.env.JWT_SECRET || 'default-secret-change-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
};

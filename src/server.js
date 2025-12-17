const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const config = require('./config/env');
const connectDB = require('./config/database');
const errorHandler = require('./middlewares/errorHandler');
const { swaggerUi, swaggerSpec } = require('./config/swagger');

const authRoutes = require('./routes/authRoutes');
const tenantRoutes = require('./routes/tenantRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');

const app = express();
connectDB();


app.use(helmet());
app.set('trust proxy', 1);

app.use(cors({
  origin: config.CORS_ORIGIN,
  credentials: true
}));

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
  console.log('Modo desarrollo activado: Logs detallados');
}


const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 500, 
  message: 'Demasiadas peticiones desde esta IP, por favor intenta más tarde.'
});
app.use('/api/', limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});


const swaggerUiOptions = {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'E-Commerce API Docs',
  swaggerOptions: {
    persistAuthorization: true
  }
};

app.use('/api-docs', swaggerUi.serve);
app.get('/api-docs', swaggerUi.setup(swaggerSpec, swaggerUiOptions));

app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

app.use('/api/auth', authRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada'
  });
});

app.use(errorHandler);


const PORT = config.PORT;

app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════════════════╗
  ║                                                   ║
  ║   🚀 Server running on port ${PORT}                ║
  ║   📦 Environment: ${config.NODE_ENV.padEnd(27)} ║
  ║   🔗 http://localhost:${PORT}                      ║
  ║                                                   ║
  ╚═══════════════════════════════════════════════════╝
  `);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});

module.exports = app;


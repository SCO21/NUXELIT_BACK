const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimiter = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');
const routes = require('./modules/routes');

const app = express();
app.set('trust proxy', 1);

const cookieParser = require('cookie-parser');
const mongoSanitize = require('./middleware/mongoSanitize');

// Cookie parsing Middleware
app.use(cookieParser());

// Sanitize data against NoSQL Injection
app.use(mongoSanitize);

// Security Middleware
app.use(helmet());

// Dynamic CORS configuration supporting cookie credentials
const allowedOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:5173', 'http://localhost:5174'];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      return callback(null, false);
    }
    return callback(null, true);
  },
  credentials: true
}));

// Body parsing Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging Middleware
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Rate Limiting
app.use(rateLimiter.general);

// Routes
app.use('/api/v1', routes);

// Base route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Nuxelit API' });
});

app.get('/api/v1/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      uptime: process.uptime(),
      database: 'connected',
      version: '1.0.0'
    }
  });
});

// Error handling middleware
app.use(errorHandler);

module.exports = app;

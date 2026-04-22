const rateLimit = require('express-rate-limit');

// General rate limiter
const general = rateLimit({
  windowMs: process.env.RATE_LIMIT_WINDOW_MS || 60000,
  max: process.env.RATE_LIMIT_MAX || 100,
  message: {
    success: false,
    message: 'Demasiadas solicitudes desde esta IP, por favor intenta de nuevo más tarde.'
  }
});

// Contact and Quotes rate limiter (stricter)
const strict = rateLimit({
  windowMs: process.env.RATE_LIMIT_WINDOW_MS || 60000,
  max: 5,
  message: {
    success: false,
    message: 'Demasiadas solicitudes. Por favor, espera antes de enviar otro formulario.'
  }
});

// Chatbot message rate limiter
const chatbotMsg = rateLimit({
  windowMs: process.env.RATE_LIMIT_WINDOW_MS || 60000,
  max: 20,
  message: {
    success: false,
    message: 'Límite de mensajes alcanzado. Por favor, espera un minuto.'
  }
});

// Admin login rate limiter
const adminLogin = rateLimit({
  windowMs: process.env.RATE_LIMIT_WINDOW_MS || 60000,
  max: 5,
  message: {
    success: false,
    message: 'Demasiados intentos fallidos. Intenta nuevamente más tarde.'
  }
});

// Analytics rate limiter
const analytics = rateLimit({
  windowMs: process.env.RATE_LIMIT_WINDOW_MS || 60000,
  max: 60,
  message: {
    success: false,
    message: 'Rate limit excedido.'
  }
});

module.exports = {
  general,
  strict,
  chatbotMsg,
  adminLogin,
  analytics
};

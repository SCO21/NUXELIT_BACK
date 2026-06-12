const rateLimit = require('express-rate-limit');

const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 60000;
const maxLimit = parseInt(process.env.RATE_LIMIT_MAX, 10) || 100;

// General rate limiter
const general = rateLimit({
  windowMs,
  max: maxLimit,
  message: {
    success: false,
    message: 'Demasiadas solicitudes desde esta IP, por favor intenta de nuevo más tarde.'
  }
});

// Contact and Quotes rate limiter (stricter)
const strict = rateLimit({
  windowMs,
  max: 5,
  message: {
    success: false,
    message: 'Demasiadas solicitudes. Por favor, espera antes de enviar otro formulario.'
  }
});

// Chatbot message rate limiter
const chatbotMsg = rateLimit({
  windowMs,
  max: 20,
  message: {
    success: false,
    message: 'Límite de mensajes alcanzado. Por favor, espera un minuto.'
  }
});

// Admin login rate limiter
const adminLogin = rateLimit({
  windowMs,
  max: 5,
  message: {
    success: false,
    message: 'Demasiados intentos fallidos. Intenta nuevamente más tarde.'
  }
});

// Analytics rate limiter
const analytics = rateLimit({
  windowMs,
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

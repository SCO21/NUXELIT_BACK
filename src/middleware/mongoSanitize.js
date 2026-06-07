/**
 * Recursively removes any keys starting with '$' or containing '.'
 * from request payloads to prevent MongoDB NoSQL Injection attacks.
 * Designed to be fully compatible with Express 5 read-only objects.
 */
const clean = (obj) => {
  if (obj instanceof Object) {
    for (const key in obj) {
      if (key.startsWith('$') || key.includes('.')) {
        delete obj[key];
      } else {
        clean(obj[key]);
      }
    }
  }
  return obj;
};

const mongoSanitize = (req, res, next) => {
  if (req.body) {
    clean(req.body);
  }
  if (req.params) {
    clean(req.params);
  }
  if (req.query) {
    try {
      // In Express 5, req.query itself is a read-only getter, 
      // but its properties are mutable, so we sanitize in-place.
      clean(req.query);
    } catch (e) {
      // Fail-safe protection
    }
  }
  next();
};

module.exports = mongoSanitize;

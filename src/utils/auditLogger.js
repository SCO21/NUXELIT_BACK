const AuditLog = require('../modules/admin/auditLog.model');
const logger = require('./logger');

/**
 * Logs an administrative or security event to the audit log collection.
 * This function handles exceptions gracefully to prevent database logging issues
 * from interrupting user operations.
 * 
 * @param {Object} options
 * @param {string} [options.userId] - The ID of the authenticated user.
 * @param {string} [options.email] - Email input if userId is not resolved.
 * @param {string} options.action - Action tag (e.g. 'LOGIN_SUCCESS', 'PASSWORD_RESET')
 * @param {Object} [options.req] - Express request object to parse IP and User Agent.
 */
const logAudit = async ({ userId, email, action, req }) => {
  try {
    let ipAddress = '127.0.0.1';
    let userAgent = 'Console/Script';

    if (req) {
      // Extract IP address accounting for proxies (e.g., Cloudflare, Vercel, Render)
      ipAddress = 
        req.headers['cf-connecting-ip'] || 
        req.headers['x-forwarded-for']?.split(',')[0].trim() || 
        req.ip || 
        req.connection?.remoteAddress || 
        '127.0.0.1';
        
      userAgent = req.headers['user-agent'] || 'Unknown Browser';
    }

    await AuditLog.create({
      userId,
      email,
      action,
      ipAddress,
      userAgent
    });
  } catch (err) {
    logger.error(`Failed to record audit log: ${err.message}`);
  }
};

module.exports = { logAudit };

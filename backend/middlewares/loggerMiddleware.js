// middlewares/loggerMiddleware.js
import db from '../config/db.js';

/**
 * Utility function to write an audit log entry.
 */
export const recordAuditLog = async (userId, action, details, ipAddress = '127.0.0.1') => {
  try {
    const query = `
      INSERT INTO audit_logs (user_id, action, details, ip_address, created_at)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      RETURNING id;
    `;
    const res = await db.query(query, [userId || null, action, details, ipAddress]);
    return res.rows[0]?.id;
  } catch (error) {
    console.error('[AUDIT LOG ERROR] Failed to record audit log:', error.message);
  }
};

/**
 * Express middleware to automatically log mutating operations (POST, PUT, DELETE)
 */
export const apiAuditLogger = (req, res, next) => {
  // Capture the original send to log after response
  const originalJson = res.json.bind(res);

  res.json = (body) => {
    // Only log successful mutating calls if user is authenticated
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) && req.user && res.statusCode < 400) {
      const action = `${req.method}_${req.baseUrl.replace('/api/', '').toUpperCase()}`;
      const details = `User ${req.user.username} (${req.user.role}) called ${req.method} ${req.originalUrl}`;
      const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
      
      // Async record without blocking response
      recordAuditLog(req.user.id, action, details, String(clientIp)).catch(err => {
        console.error('[AUTO AUDIT ERROR]', err);
      });
    }
    return originalJson(body);
  };

  next();
};

export default {
  recordAuditLog,
  apiAuditLogger,
};

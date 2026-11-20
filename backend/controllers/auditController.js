// controllers/auditController.js
import db from '../config/db.js';

export const getAuditLogs = async (req, res) => {
  try {
    const { action, userId, startDate, endDate, limit = 100 } = req.query;

    const query = `
      SELECT
        al.id,
        al.user_id,
        u.username,
        u.full_name,
        u.role,
        al.action,
        al.details,
        al.ip_address,
        al.created_at
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE ($1::varchar IS NULL OR al.action = $1)
        AND ($2::int IS NULL OR al.user_id = $2)
        AND ($3::timestamp IS NULL OR al.created_at >= $3::timestamp)
        AND ($4::timestamp IS NULL OR al.created_at <= $4::timestamp)
      ORDER BY al.created_at DESC, al.id DESC
      LIMIT $5::int;
    `;

    const result = await db.query(query, [
      action || null,
      userId ? parseInt(userId, 10) : null,
      startDate || null,
      endDate || null,
      parseInt(limit, 10),
    ]);

    return res.status(200).json(result.rows);
  } catch (error) {
    console.error('[GET AUDIT LOGS ERROR]', error);
    return res.status(500).json({ error: error.message });
  }
};

export default {
  getAuditLogs,
};

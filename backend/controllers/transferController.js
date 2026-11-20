// controllers/transferController.js
import db from '../config/db.js';

/**
 * List transfers with filters and RBAC base scoping
 */
export const getTransfers = async (req, res) => {
  try {
    const { baseId, status, equipmentTypeId, startDate, endDate } = req.query;
    const user = req.user;

    let filterBaseId = baseId ? parseInt(baseId, 10) : null;

    // For Base Commanders, show transfers where their base is source OR destination
    let isCommanderScoped = false;
    if (user.role === 'BASE_COMMANDER') {
      filterBaseId = user.baseId;
      isCommanderScoped = true;
    }

    const query = `
      SELECT
        t.id,
        t.source_base_id,
        sb.name AS source_base_name,
        sb.code AS source_base_code,
        t.destination_base_id,
        db.name AS destination_base_name,
        db.code AS destination_base_code,
        t.equipment_type_id,
        eq.name AS equipment_name,
        eq.category AS equipment_category,
        eq.unit_of_measure,
        t.quantity,
        t.status,
        t.notes,
        t.timestamp,
        t.completed_at,
        u.username AS initiated_by_username,
        u.full_name AS initiated_by_name
      FROM transfers t
      JOIN bases sb ON t.source_base_id = sb.id
      JOIN bases db ON t.destination_base_id = db.id
      JOIN equipment_types eq ON t.equipment_type_id = eq.id
      LEFT JOIN users u ON t.initiated_by = u.id
      WHERE (
        ($1::int IS NULL) OR
        ($6::boolean = true AND (t.source_base_id = $1 OR t.destination_base_id = $1)) OR
        ($6::boolean = false AND (t.source_base_id = $1 OR t.destination_base_id = $1))
      )
      AND ($2::varchar IS NULL OR t.status = $2)
      AND ($3::int IS NULL OR t.equipment_type_id = $3)
      AND ($4::timestamp IS NULL OR t.timestamp >= $4::timestamp)
      AND ($5::timestamp IS NULL OR t.timestamp <= $5::timestamp)
      ORDER BY t.timestamp DESC, t.id DESC;
    `;

    const result = await db.query(query, [
      filterBaseId,
      status || null,
      equipmentTypeId ? parseInt(equipmentTypeId, 10) : null,
      startDate || null,
      endDate || null,
      isCommanderScoped,
    ]);

    return res.status(200).json(result.rows);
  } catch (error) {
    console.error('[GET TRANSFERS ERROR]', error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Creates an atomic transfer between bases
 */
export const createTransfer = async (req, res) => {
  const client = await db.getClient();
  try {
    const { sourceBaseId, destinationBaseId, equipmentTypeId, quantity, status = 'COMPLETED', notes } = req.body;
    const userId = req.user.id;

    if (!sourceBaseId || !destinationBaseId || !equipmentTypeId || !quantity || quantity <= 0) {
      return res.status(400).json({
        error: 'sourceBaseId, destinationBaseId, equipmentTypeId, and quantity (> 0) are required.',
      });
    }

    if (parseInt(sourceBaseId, 10) === parseInt(destinationBaseId, 10)) {
      return res.status(400).json({
        error: 'Source base and destination base cannot be identical.',
      });
    }

    // Role check: If Base Commander, sourceBaseId must be their assigned base
    if (req.user.role === 'BASE_COMMANDER' && req.user.baseId !== parseInt(sourceBaseId, 10)) {
      return res.status(403).json({
        error: 'Access Denied: Base Commanders can only dispatch transfers originating from their assigned base.',
      });
    }

    await client.query('BEGIN'); // Start Transaction

    // Check source base stock availability
    const stockQuery = `
      SELECT
        (
          COALESCE((SELECT quantity FROM initial_balances WHERE base_id = $1 AND equipment_type_id = $2), 0) +
          COALESCE((SELECT SUM(quantity) FROM purchases WHERE base_id = $1 AND equipment_type_id = $2), 0) +
          COALESCE((SELECT SUM(quantity) FROM transfers WHERE destination_base_id = $1 AND equipment_type_id = $2 AND status = 'COMPLETED'), 0) -
          COALESCE((SELECT SUM(quantity) FROM transfers WHERE source_base_id = $1 AND equipment_type_id = $2 AND status IN ('COMPLETED', 'IN_TRANSIT')), 0) -
          COALESCE((SELECT SUM(quantity) FROM assignments WHERE base_id = $1 AND equipment_type_id = $2 AND status = 'ACTIVE'), 0) -
          COALESCE((SELECT SUM(quantity) FROM expenditures WHERE base_id = $1 AND equipment_type_id = $2), 0)
        ) AS current_available_stock;
    `;
    const stockRes = await client.query(stockQuery, [sourceBaseId, equipmentTypeId]);
    const currentStock = parseInt(stockRes.rows[0]?.current_available_stock || 0, 10);

    if (currentStock < parseInt(quantity, 10)) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: `Insufficient inventory at source base. Available stock: ${currentStock}, Requested transfer: ${quantity}`,
        availableStock: currentStock,
      });
    }

    // 1. Insert Transfer Record
    const transferQuery = `
      INSERT INTO transfers (
        source_base_id, destination_base_id, equipment_type_id,
        quantity, status, notes, initiated_by, timestamp, completed_at
      )
      VALUES ($1, $2, $3, $4, $5::varchar, $6, $7, CURRENT_TIMESTAMP, CASE WHEN $5::varchar = 'COMPLETED' THEN CURRENT_TIMESTAMP ELSE NULL END)
      RETURNING *;
    `;
    const transferRes = await client.query(transferQuery, [
      sourceBaseId,
      destinationBaseId,
      equipmentTypeId,
      quantity,
      status,
      notes || null,
      userId,
    ]);

    const createdTransfer = transferRes.rows[0];

    // Fetch names for clean audit details
    const namesQuery = `
      SELECT
        (SELECT name FROM bases WHERE id = $1) AS src_name,
        (SELECT name FROM bases WHERE id = $2) AS dst_name,
        (SELECT name FROM equipment_types WHERE id = $3) AS equip_name;
    `;
    const namesRes = await client.query(namesQuery, [sourceBaseId, destinationBaseId, equipmentTypeId]);
    const { src_name, dst_name, equip_name } = namesRes.rows[0];

    // 2. Log Action in Audit Table
    const auditQuery = `
      INSERT INTO audit_logs (user_id, action, details, ip_address, created_at)
      VALUES ($1, 'TRANSFER', $2, $3, CURRENT_TIMESTAMP);
    `;
    const details = `Initiated transfer #${createdTransfer.id}: ${quantity} ${equip_name} from ${src_name} to ${dst_name} [Status: ${status}]`;
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    await client.query(auditQuery, [userId, details, String(clientIp)]);

    await client.query('COMMIT'); // Commit Transaction

    res.status(201).json({
      message: 'Transfer recorded successfully',
      transfer: createdTransfer,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[CREATE TRANSFER ERROR]', error);
    res.status(500).json({ error: 'Transfer failed: ' + error.message });
  } finally {
    client.release();
  }
};

/**
 * Updates transfer status (e.g., PENDING -> IN_TRANSIT -> COMPLETED or CANCELLED)
 */
export const updateTransferStatus = async (req, res) => {
  const client = await db.getClient();
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const userId = req.user.id;

    if (!['PENDING', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid transfer status provided.' });
    }

    await client.query('BEGIN');

    const updateQuery = `
      UPDATE transfers
      SET status = $1,
          notes = COALESCE($2, notes),
          completed_at = CASE WHEN $1 = 'COMPLETED' THEN CURRENT_TIMESTAMP ELSE completed_at END
      WHERE id = $3
      RETURNING *;
    `;
    const updateRes = await client.query(updateQuery, [status, notes || null, id]);

    if (updateRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Transfer not found.' });
    }

    const updatedTransfer = updateRes.rows[0];

    // Audit log
    const auditQuery = `
      INSERT INTO audit_logs (user_id, action, details, ip_address, created_at)
      VALUES ($1, 'TRANSFER_STATUS_UPDATE', $2, $3, CURRENT_TIMESTAMP);
    `;
    const details = `Transfer #${id} status changed to ${status}`;
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    await client.query(auditQuery, [userId, details, String(clientIp)]);

    await client.query('COMMIT');

    return res.status(200).json({
      message: `Transfer status updated to ${status}`,
      transfer: updatedTransfer,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[UPDATE TRANSFER ERROR]', error);
    return res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};

export default {
  getTransfers,
  createTransfer,
  updateTransferStatus,
};

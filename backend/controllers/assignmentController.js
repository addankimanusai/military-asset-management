// controllers/assignmentController.js
import db from '../config/db.js';

// ==================== ASSIGNMENTS ====================

export const getAssignments = async (req, res) => {
  try {
    const { baseId, equipmentTypeId, status } = req.query;
    const parsedBaseId = baseId ? parseInt(baseId, 10) : null;
    const parsedEquipId = equipmentTypeId ? parseInt(equipmentTypeId, 10) : null;

    const query = `
      SELECT
        a.id,
        a.base_id,
        b.name AS base_name,
        b.code AS base_code,
        a.equipment_type_id,
        eq.name AS equipment_name,
        eq.category AS equipment_category,
        eq.unit_of_measure,
        a.quantity,
        a.assigned_to_personnel,
        a.unit_name,
        a.assignment_date,
        a.return_date,
        a.status,
        a.notes,
        a.created_at,
        u.username AS assigned_by_username,
        u.full_name AS assigned_by_name
      FROM assignments a
      JOIN bases b ON a.base_id = b.id
      JOIN equipment_types eq ON a.equipment_type_id = eq.id
      LEFT JOIN users u ON a.assigned_by = u.id
      WHERE ($1::int IS NULL OR a.base_id = $1)
        AND ($2::int IS NULL OR a.equipment_type_id = $2)
        AND ($3::varchar IS NULL OR a.status = $3)
      ORDER BY a.assignment_date DESC, a.id DESC;
    `;

    const result = await db.query(query, [parsedBaseId, parsedEquipId, status || null]);
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error('[GET ASSIGNMENTS ERROR]', error);
    return res.status(500).json({ error: error.message });
  }
};

export const createAssignment = async (req, res) => {
  const client = await db.getClient();
  try {
    const { baseId, equipmentTypeId, quantity, assignedToPersonnel, unitName, assignmentDate, notes } = req.body;
    const userId = req.user.id;

    if (!baseId || !equipmentTypeId || !quantity || quantity <= 0 || !assignedToPersonnel || !unitName) {
      return res.status(400).json({
        error: 'baseId, equipmentTypeId, quantity (> 0), assignedToPersonnel, and unitName are required.',
      });
    }

    await client.query('BEGIN');

    // Verify stock availability
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
    const stockRes = await client.query(stockQuery, [baseId, equipmentTypeId]);
    const currentStock = parseInt(stockRes.rows[0]?.current_available_stock || 0, 10);

    if (currentStock < parseInt(quantity, 10)) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: `Insufficient available inventory to assign. Available unassigned: ${currentStock}, Requested: ${quantity}`,
      });
    }

    const insertQuery = `
      INSERT INTO assignments (
        base_id, equipment_type_id, quantity, assigned_to_personnel,
        unit_name, assignment_date, status, notes, assigned_by, created_at
      )
      VALUES ($1, $2, $3, $4, $5, COALESCE($6::date, CURRENT_DATE), 'ACTIVE', $7, $8, CURRENT_TIMESTAMP)
      RETURNING *;
    `;
    const assignRes = await client.query(insertQuery, [
      baseId,
      equipmentTypeId,
      quantity,
      assignedToPersonnel,
      unitName,
      assignmentDate || null,
      notes || null,
      userId,
    ]);

    const createdAssignment = assignRes.rows[0];

    // Audit log
    const metaRes = await client.query(
      `SELECT b.name as base_name, eq.name as equipment_name FROM bases b, equipment_types eq WHERE b.id = $1 AND eq.id = $2`,
      [baseId, equipmentTypeId]
    );
    const baseName = metaRes.rows[0]?.base_name || `Base #${baseId}`;
    const equipName = metaRes.rows[0]?.equipment_name || `Item #${equipmentTypeId}`;

    const auditQuery = `
      INSERT INTO audit_logs (user_id, action, details, ip_address, created_at)
      VALUES ($1, 'ASSIGNMENT', $2, $3, CURRENT_TIMESTAMP);
    `;
    const details = `Assigned ${quantity} ${equipName} at ${baseName} to ${assignedToPersonnel} (${unitName})`;
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    await client.query(auditQuery, [userId, details, String(clientIp)]);

    await client.query('COMMIT');

    return res.status(201).json({
      message: 'Asset assigned successfully',
      assignment: createdAssignment,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[CREATE ASSIGNMENT ERROR]', error);
    return res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};

export const returnAssignment = async (req, res) => {
  const client = await db.getClient();
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await client.query('BEGIN');

    const updateQuery = `
      UPDATE assignments
      SET status = 'RETURNED',
          return_date = CURRENT_DATE
      WHERE id = $1 AND status = 'ACTIVE'
      RETURNING *;
    `;
    const result = await client.query(updateQuery, [id]);

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Active assignment not found or already returned.' });
    }

    const assignment = result.rows[0];

    const auditQuery = `
      INSERT INTO audit_logs (user_id, action, details, ip_address, created_at)
      VALUES ($1, 'ASSIGNMENT_RETURNED', $2, $3, CURRENT_TIMESTAMP);
    `;
    const details = `Returned assignment #${id} (${assignment.quantity} items from ${assignment.assigned_to_personnel})`;
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    await client.query(auditQuery, [userId, details, String(clientIp)]);

    await client.query('COMMIT');

    return res.status(200).json({
      message: 'Asset return processed successfully',
      assignment,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[RETURN ASSIGNMENT ERROR]', error);
    return res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};

// ==================== EXPENDITURES ====================

export const getExpenditures = async (req, res) => {
  try {
    const { baseId, equipmentTypeId, reason, startDate, endDate } = req.query;
    const parsedBaseId = baseId ? parseInt(baseId, 10) : null;
    const parsedEquipId = equipmentTypeId ? parseInt(equipmentTypeId, 10) : null;

    const query = `
      SELECT
        e.id,
        e.base_id,
        b.name AS base_name,
        b.code AS base_code,
        e.equipment_type_id,
        eq.name AS equipment_name,
        eq.category AS equipment_category,
        eq.unit_of_measure,
        e.quantity,
        e.reason,
        e.expenditure_date,
        e.authorized_by,
        e.notes,
        e.created_at,
        u.username AS recorded_by_username,
        u.full_name AS recorded_by_name
      FROM expenditures e
      JOIN bases b ON e.base_id = b.id
      JOIN equipment_types eq ON e.equipment_type_id = eq.id
      LEFT JOIN users u ON e.recorded_by = u.id
      WHERE ($1::int IS NULL OR e.base_id = $1)
        AND ($2::int IS NULL OR e.equipment_type_id = $2)
        AND ($3::varchar IS NULL OR e.reason = $3)
        AND ($4::date IS NULL OR e.expenditure_date >= $4::date)
        AND ($5::date IS NULL OR e.expenditure_date <= $5::date)
      ORDER BY e.expenditure_date DESC, e.id DESC;
    `;

    const result = await db.query(query, [
      parsedBaseId,
      parsedEquipId,
      reason || null,
      startDate || null,
      endDate || null,
    ]);

    return res.status(200).json(result.rows);
  } catch (error) {
    console.error('[GET EXPENDITURES ERROR]', error);
    return res.status(500).json({ error: error.message });
  }
};

export const createExpenditure = async (req, res) => {
  const client = await db.getClient();
  try {
    const { baseId, equipmentTypeId, quantity, reason, authorizedBy, expenditureDate, notes } = req.body;
    const userId = req.user.id;

    if (!baseId || !equipmentTypeId || !quantity || quantity <= 0 || !reason || !authorizedBy) {
      return res.status(400).json({
        error: 'baseId, equipmentTypeId, quantity (> 0), reason, and authorizedBy are required.',
      });
    }

    await client.query('BEGIN');

    // Check available stock
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
    const stockRes = await client.query(stockQuery, [baseId, equipmentTypeId]);
    const currentStock = parseInt(stockRes.rows[0]?.current_available_stock || 0, 10);

    if (currentStock < parseInt(quantity, 10)) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: `Insufficient stock to record expenditure. Available stock: ${currentStock}, Requested expenditure: ${quantity}`,
      });
    }

    const insertQuery = `
      INSERT INTO expenditures (
        base_id, equipment_type_id, quantity, reason,
        expenditure_date, authorized_by, notes, recorded_by, created_at
      )
      VALUES ($1, $2, $3, $4, COALESCE($5::date, CURRENT_DATE), $6, $7, $8, CURRENT_TIMESTAMP)
      RETURNING *;
    `;
    const expRes = await client.query(insertQuery, [
      baseId,
      equipmentTypeId,
      quantity,
      reason,
      expenditureDate || null,
      authorizedBy,
      notes || null,
      userId,
    ]);

    const createdExpenditure = expRes.rows[0];

    // Audit log
    const metaRes = await client.query(
      `SELECT b.name as base_name, eq.name as equipment_name FROM bases b, equipment_types eq WHERE b.id = $1 AND eq.id = $2`,
      [baseId, equipmentTypeId]
    );
    const baseName = metaRes.rows[0]?.base_name || `Base #${baseId}`;
    const equipName = metaRes.rows[0]?.equipment_name || `Item #${equipmentTypeId}`;

    const auditQuery = `
      INSERT INTO audit_logs (user_id, action, details, ip_address, created_at)
      VALUES ($1, 'EXPENDITURE', $2, $3, CURRENT_TIMESTAMP);
    `;
    const details = `Recorded expenditure of ${quantity} ${equipName} at ${baseName} (Reason: ${reason}, Authorized by: ${authorizedBy})`;
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    await client.query(auditQuery, [userId, details, String(clientIp)]);

    await client.query('COMMIT');

    return res.status(201).json({
      message: 'Expenditure logged successfully',
      expenditure: createdExpenditure,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[CREATE EXPENDITURE ERROR]', error);
    return res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};

export default {
  getAssignments,
  createAssignment,
  returnAssignment,
  getExpenditures,
  createExpenditure,
};

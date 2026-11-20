// controllers/purchaseController.js
import db from '../config/db.js';

export const getPurchases = async (req, res) => {
  try {
    const { baseId, equipmentTypeId, startDate, endDate, search } = req.query;

    const parsedBaseId = baseId ? parseInt(baseId, 10) : null;
    const parsedEquipId = equipmentTypeId ? parseInt(equipmentTypeId, 10) : null;
    const searchPattern = search ? `%${search}%` : null;

    const query = `
      SELECT
        p.id,
        p.base_id,
        b.name AS base_name,
        b.code AS base_code,
        p.equipment_type_id,
        eq.name AS equipment_name,
        eq.category AS equipment_category,
        eq.unit_of_measure,
        p.quantity,
        p.unit_cost,
        (p.quantity * p.unit_cost) AS total_cost,
        p.supplier,
        p.purchase_order_number,
        p.purchase_date,
        p.created_at,
        u.username AS created_by_username,
        u.full_name AS created_by_name
      FROM purchases p
      JOIN bases b ON p.base_id = b.id
      JOIN equipment_types eq ON p.equipment_type_id = eq.id
      LEFT JOIN users u ON p.created_by = u.id
      WHERE ($1::int IS NULL OR p.base_id = $1)
        AND ($2::int IS NULL OR p.equipment_type_id = $2)
        AND ($3::date IS NULL OR p.purchase_date >= $3::date)
        AND ($4::date IS NULL OR p.purchase_date <= $4::date)
        AND (
          $5::varchar IS NULL OR
          p.supplier ILIKE $5 OR
          p.purchase_order_number ILIKE $5 OR
          eq.name ILIKE $5
        )
      ORDER BY p.purchase_date DESC, p.id DESC;
    `;

    const result = await db.query(query, [
      parsedBaseId,
      parsedEquipId,
      startDate || null,
      endDate || null,
      searchPattern,
    ]);

    return res.status(200).json(result.rows);
  } catch (error) {
    console.error('[GET PURCHASES ERROR]', error);
    return res.status(500).json({ error: error.message });
  }
};

export const createPurchase = async (req, res) => {
  const client = await db.getClient();
  try {
    const { baseId, equipmentTypeId, quantity, unitCost, supplier, purchaseOrderNumber, purchaseDate } = req.body;
    const userId = req.user.id;

    if (!baseId || !equipmentTypeId || !quantity || quantity <= 0) {
      return res.status(400).json({
        error: 'baseId, equipmentTypeId, and a valid quantity (> 0) are required.',
      });
    }

    await client.query('BEGIN'); // Start Transaction

    // 1. Insert Purchase Record
    const insertQuery = `
      INSERT INTO purchases (
        base_id, equipment_type_id, quantity, unit_cost,
        supplier, purchase_order_number, purchase_date, created_by, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7::date, CURRENT_DATE), $8, CURRENT_TIMESTAMP)
      RETURNING *;
    `;
    const purchaseRes = await client.query(insertQuery, [
      baseId,
      equipmentTypeId,
      quantity,
      unitCost || 0.0,
      supplier || 'Standard Procurement',
      purchaseOrderNumber || `PO-${Date.now().toString().slice(-6)}`,
      purchaseDate || null,
      userId,
    ]);

    const createdPurchase = purchaseRes.rows[0];

    // 2. Fetch Equipment & Base names for meaningful audit log
    const metaRes = await client.query(
      `SELECT b.name as base_name, eq.name as equipment_name 
       FROM bases b, equipment_types eq 
       WHERE b.id = $1 AND eq.id = $2`,
      [baseId, equipmentTypeId]
    );
    const baseName = metaRes.rows[0]?.base_name || `Base #${baseId}`;
    const equipName = metaRes.rows[0]?.equipment_name || `Item #${equipmentTypeId}`;

    // 3. Log Action in Audit Table
    const auditQuery = `
      INSERT INTO audit_logs (user_id, action, details, ip_address, created_at)
      VALUES ($1, 'PURCHASE', $2, $3, CURRENT_TIMESTAMP);
    `;
    const details = `Logged purchase of ${quantity} ${equipName} for ${baseName} (Supplier: ${supplier || 'N/A'}, PO: ${createdPurchase.purchase_order_number})`;
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    await client.query(auditQuery, [userId, details, String(clientIp)]);

    await client.query('COMMIT'); // Commit Transaction

    return res.status(201).json({
      message: 'Purchase recorded successfully',
      purchase: createdPurchase,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[CREATE PURCHASE ERROR]', error);
    return res.status(500).json({ error: 'Purchase transaction failed: ' + error.message });
  } finally {
    client.release();
  }
};

export default {
  getPurchases,
  createPurchase,
};

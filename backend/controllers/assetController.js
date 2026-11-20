// controllers/assetController.js
import db from '../config/db.js';

/**
 * Calculates high-level dashboard metrics enforcing:
 * Closing Balance = Opening Balance + Net Movement - Assigned - Expended
 * Net Movement = Purchases + Transfers In - Transfers Out
 */
export const getDashboardMetrics = async (req, res) => {
  try {
    const { baseId, equipmentTypeId, category, startDate, endDate } = req.query;

    const parsedBaseId = baseId ? parseInt(baseId, 10) : null;
    const parsedEquipId = equipmentTypeId ? parseInt(equipmentTypeId, 10) : null;
    const catFilter = category || null;
    const startFilter = startDate || null;
    const endFilter = endDate || null;

    // Complex aggregation query computing Opening, Movements, Expenditures & Closing
    const query = `
      WITH filtered_equipment AS (
        SELECT id FROM equipment_types
        WHERE ($2::int IS NULL OR id = $2)
          AND ($3::varchar IS NULL OR category = $3)
      ),
      initial_summary AS (
        SELECT COALESCE(SUM(ib.quantity), 0) AS total_initial
        FROM initial_balances ib
        JOIN filtered_equipment fe ON ib.equipment_type_id = fe.id
        WHERE ($1::int IS NULL OR ib.base_id = $1)
      ),
      purchase_summary AS (
        SELECT COALESCE(SUM(p.quantity), 0) AS total_purchases,
               COALESCE(SUM(p.quantity * p.unit_cost), 0) AS total_spend
        FROM purchases p
        JOIN filtered_equipment fe ON p.equipment_type_id = fe.id
        WHERE ($1::int IS NULL OR p.base_id = $1)
          AND ($4::timestamp IS NULL OR p.purchase_date >= $4::date)
          AND ($5::timestamp IS NULL OR p.purchase_date <= $5::date)
      ),
      transfer_in_summary AS (
        SELECT COALESCE(SUM(t.quantity), 0) AS total_transfer_in
        FROM transfers t
        JOIN filtered_equipment fe ON t.equipment_type_id = fe.id
        WHERE ($1::int IS NULL OR t.destination_base_id = $1)
          AND t.status = 'COMPLETED'
          AND ($4::timestamp IS NULL OR t.timestamp >= $4::timestamp)
          AND ($5::timestamp IS NULL OR t.timestamp <= $5::timestamp)
      ),
      transfer_out_summary AS (
        SELECT COALESCE(SUM(t.quantity), 0) AS total_transfer_out
        FROM transfers t
        JOIN filtered_equipment fe ON t.equipment_type_id = fe.id
        WHERE ($1::int IS NULL OR t.source_base_id = $1)
          AND t.status = 'COMPLETED'
          AND ($4::timestamp IS NULL OR t.timestamp >= $4::timestamp)
          AND ($5::timestamp IS NULL OR t.timestamp <= $5::timestamp)
      ),
      in_transit_summary AS (
        SELECT COALESCE(SUM(t.quantity), 0) AS total_in_transit
        FROM transfers t
        JOIN filtered_equipment fe ON t.equipment_type_id = fe.id
        WHERE ($1::int IS NULL OR t.source_base_id = $1 OR t.destination_base_id = $1)
          AND t.status IN ('PENDING', 'IN_TRANSIT')
      ),
      assignment_summary AS (
        SELECT COALESCE(SUM(a.quantity), 0) AS total_assigned
        FROM assignments a
        JOIN filtered_equipment fe ON a.equipment_type_id = fe.id
        WHERE ($1::int IS NULL OR a.base_id = $1)
          AND a.status = 'ACTIVE'
          AND ($4::timestamp IS NULL OR a.assignment_date >= $4::date)
          AND ($5::timestamp IS NULL OR a.assignment_date <= $5::date)
      ),
      expenditure_summary AS (
        SELECT COALESCE(SUM(e.quantity), 0) AS total_expended
        FROM expenditures e
        JOIN filtered_equipment fe ON e.equipment_type_id = fe.id
        WHERE ($1::int IS NULL OR e.base_id = $1)
          AND ($4::timestamp IS NULL OR e.expenditure_date >= $4::date)
          AND ($5::timestamp IS NULL OR e.expenditure_date <= $5::date)
      )
      SELECT
        ini.total_initial AS opening_balance,
        p.total_purchases,
        p.total_spend,
        ti.total_transfer_in,
        to_sum.total_transfer_out,
        (p.total_purchases + ti.total_transfer_in - to_sum.total_transfer_out) AS net_movement,
        a.total_assigned,
        e.total_expended,
        it.total_in_transit,
        (ini.total_initial + (p.total_purchases + ti.total_transfer_in - to_sum.total_transfer_out) - a.total_assigned - e.total_expended) AS closing_balance
      FROM initial_summary ini,
           purchase_summary p,
           transfer_in_summary ti,
           transfer_out_summary to_sum,
           in_transit_summary it,
           assignment_summary a,
           expenditure_summary e;
    `;

    const result = await db.query(query, [
      parsedBaseId,
      parsedEquipId,
      catFilter,
      startFilter,
      endFilter,
    ]);

    const metrics = result.rows[0];

    // Normalize integers
    const responsePayload = {
      openingBalance: parseInt(metrics.opening_balance || 0, 10),
      purchases: parseInt(metrics.total_purchases || 0, 10),
      transfersIn: parseInt(metrics.total_transfer_in || 0, 10),
      transfersOut: parseInt(metrics.total_transfer_out || 0, 10),
      netMovement: parseInt(metrics.net_movement || 0, 10),
      assigned: parseInt(metrics.total_assigned || 0, 10),
      expended: parseInt(metrics.total_expended || 0, 10),
      inTransit: parseInt(metrics.total_in_transit || 0, 10),
      closingBalance: parseInt(metrics.closing_balance || 0, 10),
      totalSpend: parseFloat(metrics.total_spend || 0),
    };

    return res.status(200).json(responsePayload);
  } catch (error) {
    console.error('[ASSET METRICS ERROR]', error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Detailed itemized inventory matrix per equipment type
 */
export const getInventoryBreakdown = async (req, res) => {
  try {
    const { baseId, category } = req.query;
    const parsedBaseId = baseId ? parseInt(baseId, 10) : null;
    const catFilter = category || null;

    const query = `
      SELECT
        eq.id AS equipment_type_id,
        eq.name AS equipment_name,
        eq.category,
        eq.unit_of_measure,
        COALESCE(ib.quantity, 0) AS opening_balance,
        COALESCE(p.total_purchases, 0) AS purchases,
        COALESCE(ti.total_transfer_in, 0) AS transfers_in,
        COALESCE(to_sum.total_transfer_out, 0) AS transfers_out,
        (COALESCE(p.total_purchases, 0) + COALESCE(ti.total_transfer_in, 0) - COALESCE(to_sum.total_transfer_out, 0)) AS net_movement,
        COALESCE(a.total_assigned, 0) AS assigned,
        COALESCE(e.total_expended, 0) AS expended,
        (
          COALESCE(ib.quantity, 0) +
          (COALESCE(p.total_purchases, 0) + COALESCE(ti.total_transfer_in, 0) - COALESCE(to_sum.total_transfer_out, 0)) -
          COALESCE(a.total_assigned, 0) -
          COALESCE(e.total_expended, 0)
        ) AS closing_balance
      FROM equipment_types eq
      LEFT JOIN (
        SELECT equipment_type_id, SUM(quantity) AS quantity
        FROM initial_balances
        WHERE ($1::int IS NULL OR base_id = $1)
        GROUP BY equipment_type_id
      ) ib ON eq.id = ib.equipment_type_id
      LEFT JOIN (
        SELECT equipment_type_id, SUM(quantity) AS total_purchases
        FROM purchases
        WHERE ($1::int IS NULL OR base_id = $1)
        GROUP BY equipment_type_id
      ) p ON eq.id = p.equipment_type_id
      LEFT JOIN (
        SELECT equipment_type_id, SUM(quantity) AS total_transfer_in
        FROM transfers
        WHERE ($1::int IS NULL OR destination_base_id = $1)
          AND status = 'COMPLETED'
        GROUP BY equipment_type_id
      ) ti ON eq.id = ti.equipment_type_id
      LEFT JOIN (
        SELECT equipment_type_id, SUM(quantity) AS total_transfer_out
        FROM transfers
        WHERE ($1::int IS NULL OR source_base_id = $1)
          AND status = 'COMPLETED'
        GROUP BY equipment_type_id
      ) to_sum ON eq.id = to_sum.equipment_type_id
      LEFT JOIN (
        SELECT equipment_type_id, SUM(quantity) AS total_assigned
        FROM assignments
        WHERE ($1::int IS NULL OR base_id = $1)
          AND status = 'ACTIVE'
        GROUP BY equipment_type_id
      ) a ON eq.id = a.equipment_type_id
      LEFT JOIN (
        SELECT equipment_type_id, SUM(quantity) AS total_expended
        FROM expenditures
        WHERE ($1::int IS NULL OR base_id = $1)
        GROUP BY equipment_type_id
      ) e ON eq.id = e.equipment_type_id
      WHERE ($2::varchar IS NULL OR eq.category = $2)
      ORDER BY eq.category, eq.name;
    `;

    const result = await db.query(query, [parsedBaseId, catFilter]);
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error('[INVENTORY BREAKDOWN ERROR]', error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Category-level aggregation for visual charts (Donut / Pie charts)
 */
export const getCategoryStats = async (req, res) => {
  try {
    const { baseId } = req.query;
    const parsedBaseId = baseId ? parseInt(baseId, 10) : null;

    const query = `
      SELECT
        eq.category,
        COALESCE(SUM(ib.quantity), 0) +
        (COALESCE(SUM(p.total_purchases), 0) + COALESCE(SUM(ti.total_transfer_in), 0) - COALESCE(SUM(to_sum.total_transfer_out), 0)) -
        COALESCE(SUM(a.total_assigned), 0) -
        COALESCE(SUM(e.total_expended), 0) AS total_stock
      FROM equipment_types eq
      LEFT JOIN (
        SELECT equipment_type_id, SUM(quantity) AS quantity
        FROM initial_balances
        WHERE ($1::int IS NULL OR base_id = $1)
        GROUP BY equipment_type_id
      ) ib ON eq.id = ib.equipment_type_id
      LEFT JOIN (
        SELECT equipment_type_id, SUM(quantity) AS total_purchases
        FROM purchases
        WHERE ($1::int IS NULL OR base_id = $1)
        GROUP BY equipment_type_id
      ) p ON eq.id = p.equipment_type_id
      LEFT JOIN (
        SELECT equipment_type_id, SUM(quantity) AS total_transfer_in
        FROM transfers
        WHERE ($1::int IS NULL OR destination_base_id = $1)
          AND status = 'COMPLETED'
        GROUP BY equipment_type_id
      ) ti ON eq.id = ti.equipment_type_id
      LEFT JOIN (
        SELECT equipment_type_id, SUM(quantity) AS total_transfer_out
        FROM transfers
        WHERE ($1::int IS NULL OR source_base_id = $1)
          AND status = 'COMPLETED'
        GROUP BY equipment_type_id
      ) to_sum ON eq.id = to_sum.equipment_type_id
      LEFT JOIN (
        SELECT equipment_type_id, SUM(quantity) AS total_assigned
        FROM assignments
        WHERE ($1::int IS NULL OR base_id = $1)
          AND status = 'ACTIVE'
        GROUP BY equipment_type_id
      ) a ON eq.id = a.equipment_type_id
      LEFT JOIN (
        SELECT equipment_type_id, SUM(quantity) AS total_expended
        FROM expenditures
        WHERE ($1::int IS NULL OR base_id = $1)
        GROUP BY equipment_type_id
      ) e ON eq.id = e.equipment_type_id
      GROUP BY eq.category
      ORDER BY eq.category;
    `;

    const result = await db.query(query, [parsedBaseId]);
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error('[CATEGORY STATS ERROR]', error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Base-to-base comparison metrics (for Admin dashboard view)
 */
export const getBaseComparison = async (req, res) => {
  try {
    const query = `
      SELECT
        b.id AS base_id,
        b.name AS base_name,
        b.code AS base_code,
        b.location,
        COALESCE(ini.total_initial, 0) AS opening_balance,
        COALESCE(p.total_purchases, 0) AS purchases,
        COALESCE(ti.total_transfer_in, 0) AS transfers_in,
        COALESCE(to_sum.total_transfer_out, 0) AS transfers_out,
        (COALESCE(p.total_purchases, 0) + COALESCE(ti.total_transfer_in, 0) - COALESCE(to_sum.total_transfer_out, 0)) AS net_movement,
        COALESCE(a.total_assigned, 0) AS assigned,
        COALESCE(e.total_expended, 0) AS expended,
        (
          COALESCE(ini.total_initial, 0) +
          (COALESCE(p.total_purchases, 0) + COALESCE(ti.total_transfer_in, 0) - COALESCE(to_sum.total_transfer_out, 0)) -
          COALESCE(a.total_assigned, 0) -
          COALESCE(e.total_expended, 0)
        ) AS closing_balance
      FROM bases b
      LEFT JOIN (
        SELECT base_id, SUM(quantity) AS total_initial
        FROM initial_balances
        GROUP BY base_id
      ) ini ON b.id = ini.base_id
      LEFT JOIN (
        SELECT base_id, SUM(quantity) AS total_purchases
        FROM purchases
        GROUP BY base_id
      ) p ON b.id = p.base_id
      LEFT JOIN (
        SELECT destination_base_id, SUM(quantity) AS total_transfer_in
        FROM transfers
        WHERE status = 'COMPLETED'
        GROUP BY destination_base_id
      ) ti ON b.id = ti.destination_base_id
      LEFT JOIN (
        SELECT source_base_id, SUM(quantity) AS total_transfer_out
        FROM transfers
        WHERE status = 'COMPLETED'
        GROUP BY source_base_id
      ) to_sum ON b.id = to_sum.source_base_id
      LEFT JOIN (
        SELECT base_id, SUM(quantity) AS total_assigned
        FROM assignments
        WHERE status = 'ACTIVE'
        GROUP BY base_id
      ) a ON b.id = a.base_id
      LEFT JOIN (
        SELECT base_id, SUM(quantity) AS total_expended
        FROM expenditures
        GROUP BY base_id
      ) e ON b.id = e.base_id
      ORDER BY b.id;
    `;

    const result = await db.query(query);
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error('[BASE COMPARISON ERROR]', error);
    return res.status(500).json({ error: error.message });
  }
};

export default {
  getDashboardMetrics,
  getInventoryBreakdown,
  getCategoryStats,
  getBaseComparison,
};

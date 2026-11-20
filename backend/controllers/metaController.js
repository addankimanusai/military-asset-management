// controllers/metaController.js
import db from '../config/db.js';

export const getBases = async (req, res) => {
  try {
    const query = `SELECT id, name, code, location, commander_name, created_at FROM bases ORDER BY id;`;
    const result = await db.query(query);
    return res.status(200).json(result.rows);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getEquipmentTypes = async (req, res) => {
  try {
    const { category } = req.query;
    const query = `
      SELECT id, name, category, unit_of_measure, description 
      FROM equipment_types 
      WHERE ($1::varchar IS NULL OR category = $1)
      ORDER BY category, name;
    `;
    const result = await db.query(query, [category || null]);
    return res.status(200).json(result.rows);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export default {
  getBases,
  getEquipmentTypes,
};

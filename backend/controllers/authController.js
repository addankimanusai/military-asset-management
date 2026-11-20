import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../config/db.js';
import { recordAuditLog } from '../middlewares/loggerMiddleware.js';

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    const query = `
      SELECT u.id, u.username, u.full_name, u.password_hash, u.role, u.base_id,
             b.name AS base_name, b.code AS base_code
      FROM users u
      LEFT JOIN bases b ON u.base_id = b.id
      WHERE u.username = $1;
    `;

    const result = await db.query(query, [username]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const tokenPayload = {
      id: user.id,
      username: user.username,
      role: user.role,
      baseId: user.base_id,
      baseName: user.base_name,
      baseCode: user.base_code,
      fullName: user.full_name,
    };

    const secret = process.env.JWT_SECRET || 'kristallball_super_secret_jwt_key_2026_top_secret';
    const expiresIn = process.env.JWT_EXPIRES_IN || '24h';
    const token = jwt.sign(tokenPayload, secret, { expiresIn });

    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    await recordAuditLog(user.id, 'LOGIN', `User ${user.username} logged in successfully`, String(clientIp));

    return res.status(200).json({
      message: 'Authentication successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.full_name,
        role: user.role,
        baseId: user.base_id,
        baseName: user.base_name,
        baseCode: user.base_code,
      },
    });
  } catch (error) {
    console.error('[AUTH ERROR]', error);
    return res.status(500).json({ error: 'Authentication failed: ' + error.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    const query = `
      SELECT u.id, u.username, u.full_name, u.role, u.base_id, u.created_at,
             b.name AS base_name, b.code AS base_code, b.location AS base_location
      FROM users u
      LEFT JOIN bases b ON u.base_id = b.id
      WHERE u.id = $1;
    `;
    const result = await db.query(query, [req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve profile: ' + error.message });
  }
};

export default {
  login,
  getProfile,
};

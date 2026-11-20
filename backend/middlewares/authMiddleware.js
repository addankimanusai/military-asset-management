import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      error: 'Authentication required. No token provided.',
    });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'kristallball_super_secret_jwt_key_2026_top_secret', (err, user) => {
    if (err) {
      return res.status(401).json({
        error: 'Invalid or expired session token.',
      });
    }
    req.user = user;
    next();
  });
};

export default authenticateToken;

// middlewares/rbacMiddleware.js

/**
 * Validates that the authenticated user possesses one of the authorized roles.
 */
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: "Access Denied: Insufficient authorization level.",
        requiredRoles: allowedRoles,
        userRole: req.user ? req.user.role : null,
      });
    }
    next();
  };
};

/**
 * Enforces base data isolation:
 * - ADMIN: Global unrestricted scope (can filter by any base or see all).
 * - BASE_COMMANDER: Automatically scoped to user's assigned base. Cannot query or modify other bases.
 * - LOGISTICS_OFFICER: Scoped to their base unless initiating an authorized cross-base transfer.
 */
export const enforceBaseScope = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  // Base Commander is strictly locked to their base
  if (req.user.role === 'BASE_COMMANDER') {
    req.query.baseId = String(req.user.baseId);
    
    // In POST / PUT requests, enforce base assignment
    if (req.body && req.body.baseId && parseInt(req.body.baseId, 10) !== req.user.baseId) {
      return res.status(403).json({
        error: "Access Denied: Base Commanders can only operate on their assigned base.",
      });
    }

    if (req.body && req.body.sourceBaseId && parseInt(req.body.sourceBaseId, 10) !== req.user.baseId) {
      return res.status(403).json({
        error: "Access Denied: Cannot transfer assets out of a base you do not command.",
      });
    }
  }

  next();
};

export default {
  authorizeRoles,
  enforceBaseScope,
};

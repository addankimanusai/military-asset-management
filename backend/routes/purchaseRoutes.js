import express from 'express';
import { getPurchases, createPurchase } from '../controllers/purchaseController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { enforceBaseScope, authorizeRoles } from '../middlewares/rbacMiddleware.js';

const router = express.Router();

router.use(authenticateToken);

// All authenticated roles can view purchases (Base Commanders are auto-scoped to their base)
router.get('/', enforceBaseScope, getPurchases);

// Admin, Logistics Officer, and Base Commander can record purchases
router.post(
  '/',
  authorizeRoles('ADMIN', 'LOGISTICS_OFFICER', 'BASE_COMMANDER'),
  enforceBaseScope,
  createPurchase
);

export default router;

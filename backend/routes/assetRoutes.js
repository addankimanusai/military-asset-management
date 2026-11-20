import express from 'express';
import {
  getDashboardMetrics,
  getInventoryBreakdown,
  getCategoryStats,
  getBaseComparison,
} from '../controllers/assetController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { enforceBaseScope, authorizeRoles } from '../middlewares/rbacMiddleware.js';

const router = express.Router();

router.use(authenticateToken);

// Dashboard metrics & summaries with automatic base scoping
router.get('/metrics', enforceBaseScope, getDashboardMetrics);
router.get('/breakdown', enforceBaseScope, getInventoryBreakdown);
router.get('/categories', enforceBaseScope, getCategoryStats);
router.get('/base-comparison', authorizeRoles('ADMIN', 'LOGISTICS_OFFICER'), getBaseComparison);

export default router;

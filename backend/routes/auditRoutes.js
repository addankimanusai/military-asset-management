import express from 'express';
import { getAuditLogs } from '../controllers/auditController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { authorizeRoles } from '../middlewares/rbacMiddleware.js';

const router = express.Router();

router.use(authenticateToken);

// Full audit trail accessible by Admin & Base Commander (for reviewing operations)
router.get('/', authorizeRoles('ADMIN', 'BASE_COMMANDER'), getAuditLogs);

export default router;

import express from 'express';
import {
  getTransfers,
  createTransfer,
  updateTransferStatus,
} from '../controllers/transferController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { authorizeRoles } from '../middlewares/rbacMiddleware.js';

const router = express.Router();

router.use(authenticateToken);

// All roles can view transfers (Base Commanders filtered inside controller to their base as src or dst)
router.get('/', getTransfers);

// Admin, Logistics Officer, and Base Commander can initiate cross-base transfers
router.post(
  '/',
  authorizeRoles('ADMIN', 'LOGISTICS_OFFICER', 'BASE_COMMANDER'),
  createTransfer
);

// Admin, Logistics Officer, and Base Commander can update transfer status
router.patch(
  '/:id/status',
  authorizeRoles('ADMIN', 'LOGISTICS_OFFICER', 'BASE_COMMANDER'),
  updateTransferStatus
);

export default router;

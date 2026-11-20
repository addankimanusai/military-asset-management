import express from 'express';
import {
  getAssignments,
  createAssignment,
  returnAssignment,
  getExpenditures,
  createExpenditure,
} from '../controllers/assignmentController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { enforceBaseScope, authorizeRoles } from '../middlewares/rbacMiddleware.js';

const router = express.Router();

router.use(authenticateToken);

// Assignments endpoints
router.get('/', enforceBaseScope, getAssignments);
router.post(
  '/',
  authorizeRoles('ADMIN', 'BASE_COMMANDER'),
  enforceBaseScope,
  createAssignment
);
router.patch(
  '/:id/return',
  authorizeRoles('ADMIN', 'BASE_COMMANDER'),
  returnAssignment
);

// Expenditures endpoints
router.get('/expenditures', enforceBaseScope, getExpenditures);
router.post(
  '/expenditures',
  authorizeRoles('ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER'),
  enforceBaseScope,
  createExpenditure
);

export default router;

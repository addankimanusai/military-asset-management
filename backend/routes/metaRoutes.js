import express from 'express';
import { getBases, getEquipmentTypes } from '../controllers/metaController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/bases', getBases);
router.get('/equipment-types', getEquipmentTypes);

export default router;

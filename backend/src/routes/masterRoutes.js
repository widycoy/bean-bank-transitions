// src/routes/masterRoutes.js
import express from 'express';
import { getMasterDataController } from '../controllers/masterController.js';

const router = express.Router();

// Contoh: GET /api/master/customer_state
router.get('/:type', getMasterDataController);

export default router;

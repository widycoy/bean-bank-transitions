import express from 'express';
import {
  getMasterDataByType,
  createMasterData,
  updateMasterData,
  deleteMasterData,
} from '../controllers/masterController.js';

const router = express.Router();

// GET master data by entity_type_name
router.get('/:entity_type_name', getMasterDataByType);

// POST new master data
router.post('/', createMasterData);

// Put master data by ID
router.put('/:id', updateMasterData);

// DELETE master data (soft delete)
router.delete('/:id', deleteMasterData);

export default router;






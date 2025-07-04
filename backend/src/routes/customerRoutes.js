import express from 'express';
import { 
  submitCustomer,
  getCustomers,
  getCustomer 
} from '../controllers/customerController.js';

const router = express.Router();

router.post('/', submitCustomer);
router.get('/', getCustomers);
router.get('/:id', getCustomer);

export default router;
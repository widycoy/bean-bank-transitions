import express from 'express';
import { submitCustomer, getCustomers } from '../controllers/customerController.js';

const router = express.Router();

router.post('/', submitCustomer);
router.get('/', getCustomers);

export default router;
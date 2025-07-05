import express from 'express';
import {
  getCustomersController,      // untuk list customer dengan fitur filter, pagination, sorting
  getCustomerByIdController,      // untuk detail berdasarkan ID
  createCustomerController        // untuk insert data customer baru
} from '../controllers/customerController.js';

const router = express.Router();

// Create a new customer
router.post('/', createCustomerController);

// Get list of customers with filter/sort/pagination
router.get('/', getCustomersController);

// Get single customer by ID
router.get('/:id', getCustomerByIdController);

export default router;

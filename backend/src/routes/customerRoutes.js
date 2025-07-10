import express from 'express';
import {
  updateCustomerController,    // untuk update customer di controller
  getCustomersController,      // untuk list customer dengan fitur filter, pagination, sorting
  getCustomerByIdController,      // untuk detail berdasarkan ID
  createCustomerController        // untuk insert data customer baru
} from '../controllers/customerController.js';

import { uploadPhoto } from '../middlewares/uploadPhoto.js';

const router = express.Router();


// PATCH untuk update seluruh data + upload photo
router.patch('/:id', uploadPhoto, updateCustomerController);

// Create a new customer
router.post('/', uploadPhoto, createCustomerController);

// Get list of customers with filter/sort/pagination
router.get('/', getCustomersController);

// Get single customer by ID
router.get('/:id', getCustomerByIdController);

export default router;

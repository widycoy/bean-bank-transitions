import express from 'express';
import {
  deleteCustomerController,     // for delete customer in the controller
  updateCustomerController,    // for update customer in the controller
  getCustomersController,      // for customer list with filter, pagination , sorting feature
  getCustomerByIdController,      // for detail base on ID
  createCustomerController        // for insert data new customer
} from '../controllers/customerController.js';

import { uploadPhoto } from '../middlewares/uploadPhoto.js';

const router = express.Router();

// Soft delete customer by ID
router.delete('/:id', deleteCustomerController);

// PATCH untuk update seluruh data + upload photo
router.put('/:id', uploadPhoto, updateCustomerController);

// Create a new customer
router.post('/', uploadPhoto, createCustomerController);

// Get list of customers with filter/sort/pagination
router.get('/', getCustomersController);

// Get single customer by ID
router.get('/:id', getCustomerByIdController);

export default router;

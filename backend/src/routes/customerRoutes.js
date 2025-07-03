import express from 'express';
import { submitCustomer } from '../controllers/customerController.js';

const router = express.Router();

router.post('/', submitCustomer);

export default router;
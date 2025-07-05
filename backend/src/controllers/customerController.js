import {
  searchCustomers,
  getCustomerById,
  isKtpExistWithActiveState,
  isOfficerInOffice,
  generateCifNumber,
  insertCustomer
} from '../models/customerModel.js';

import { validateAge, isValidEmail, isValidKtp } from '../utils/validators.js';
import { validateRequiredFields } from '../validation/customerValidation.js';


// Get all customers (with search, sort, pagination)
export const getCustomersController = async (req, res) => {
  try {
    const filters = {
      ...req.query,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      sortBy: req.query.sortBy || 'c.id',
      sortOrder: req.query.sortOrder?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'
    };

    const { data, totalCount } = await searchCustomers(filters);
    const totalPages = Math.ceil(totalCount / filters.limit);
    const baseUrl = `${req.protocol}://${req.get('host')}${req.path}`;
    const buildUrl = (page) => `${baseUrl}?${new URLSearchParams({ ...req.query, page })}`;

    res.status(200).json({
      message: 'Get customers successfully',
      page: filters.page,
      limit: filters.limit,
      totalPages,
      totalCount,
      nextPage: filters.page < totalPages ? buildUrl(filters.page + 1) : null,
      prevPage: filters.page > 1 ? buildUrl(filters.page - 1) : null,
      data
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch data customer", error: err.message });
  }
};

// Get customer by ID
export const getCustomerByIdController = async (req, res) => {
  try {
    const customer = await getCustomerById(req.params.id);
    if (!customer || customer.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    res.status(200).json({
      message: 'Get customer by ID successfully',
      data: customer
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create new customer
export const createCustomerController = async (req, res) => {
  try {
    const data = req.body;
    const {
      ktp, email, date_of_birth, officer_code, office_code
    } = data;

    // Validasi
    // Validation of KTP Format 
    if (!isValidKtp(ktp)) {
      return res.status(400).json({ message: 'KTP harus 16 digit angka' });
    }

    // Empty Field Validation
    if (!validateRequiredFields(data)) {
      return res.status(400).json({ message: 'Field wajib tidak boleh kosong' });
    }

    // Age Validation between 17 and 55 years
    if (!validateAge(date_of_birth)) {
      return res.status(400).json({ message: 'Umur harus antara 17 dan 55 tahun' });
    }

    // Email Format Validation
    if (email && !isValidEmail(email)) {
      return res.status(400).json({ message: 'Format email tidak valid' });
    }

    // Unique KTP Validation for ACTIVE status
    const ktpExists = await isKtpExistWithActiveState(ktp);
    if (ktpExists) {
      return res.status(409).json({ message: 'KTP sudah digunakan oleh customer ACTIVE' });
    }

    // Validation Officer is in the same office
    const officerValid = await isOfficerInOffice(officer_code, office_code);
    if (!officerValid) {
      return res.status(400).json({ message: 'Officer harus berasal dari office yang sama' });
    }

    // Generate CIF dan Insert
    const cif_number = await generateCifNumber(office_code);
    await insertCustomer({ ...data, cif_number });

    res.status(201).json({
      message: 'Customer created successfully',
      cif_number,
      data
    });

  } catch (err) {
    res.status(500).json({ message: 'Insert failed', error: err.message });
  }
};

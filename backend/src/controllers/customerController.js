import {
  searchCustomers,
  getCustomerById,
  isKtpExistWithActiveState,
  isOfficerInOffice,
  generateCifNumber,
  insertCustomer
} from '../models/customerModel.js';

import dayjs from 'dayjs';

// Fungsi validasi email
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// Fungsi validasi data wajib
const validateRequiredFields = (body) => {
  const requiredFields = [
    'ktp', 'name', 'address', 'city_code', 'province_code',
    'phone_number', 'mother_name', 'marital_status_id', 'gender_id',
    'date_of_birth', 'place_of_birth', 'occupation', 'income_range_id',
    'residential_status_id', 'officer_code', 'office_code'
  ];

  const missing = requiredFields.filter(field => !body[field]);
  return missing.length === 0;
};

//  Main Controller
// fungsi fitur search 
export const getCustomers = async (req, res) => {
  try {
    const filters = {
      ...req.query,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      sortBy: req.query.sortBy || 'c.id',
      sortOrder: req.query.sortOrder?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'
    };

    const { data, totalCount } = await searchCustomers(filters);

    res.json({
      message: 'Customer get successfully',
      page: filters.page,
      limit: filters.limit,
      totalCount,
      totalPages: Math.ceil(totalCount / filters.limit),
      data
    });
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil data', error: err.message });
  }
};




export const getCustomer = async (req, res) => {
  try {
    const customer = await getCustomerById(req.params.id);
    if (!customer) return res.status(404).json({ message: 'User not found' });
    return res.status(200).json({
      message: 'Customer by id get successfully',
      data: customer
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


export const submitCustomer = async (req, res) => {
  try {
    const customerData = req.body;
    const {
      ktp, date_of_birth, email,
      officer_code, office_code
    } = customerData;

    // === Validasi Format KTP ===
    if (!ktp || ktp.length !== 16 || !/^\d+$/.test(ktp)) {
      return res.status(400).json({ message: 'KTP harus 16 digit angka' });
    }

    // === Validasi Field Kosong ===
    if (!validateRequiredFields(customerData)) {
      return res.status(400).json({ message: 'Field wajib tidak boleh kosong' });
    }

    // === Validasi Umur ===
    const age = dayjs().diff(dayjs(date_of_birth), 'year');
    if (age < 17 || age > 55) {
      return res.status(400).json({ message: 'Umur harus antara 17 dan 55 tahun' });
    }

    // === Validasi Format Email ===
    if (email && !isValidEmail(email)) {
      return res.status(400).json({ message: 'Format email tidak valid' });
    }

    // === Validasi KTP Unik untuk status ACTIVE ===
    const ktpExists = await isKtpExistWithActiveState(ktp);
    if (ktpExists) {
      return res.status(409).json({ message: 'KTP sudah digunakan oleh customer ACTIVE' });
    }

    // === Validasi Officer berada di office yang sama ===
    const officerValid = await isOfficerInOffice(officer_code, office_code);
    if (!officerValid) {
      return res.status(400).json({ message: 'Officer harus berasal dari office yang sama' });
    }

    // === Generate CIF dan Insert Data ===
    const cif_number = await generateCifNumber(office_code);

    await insertCustomer({
      ...customerData,
      cif_number
    });

    // === Response Success ===
    return res.status(201).json({
      message: 'Customer created successfully',
      cif_number,
      data: customerData
    });

  } catch (err) {
    return res.status(500).json({ message: 'Insert failed', error: err.message });
  }
};

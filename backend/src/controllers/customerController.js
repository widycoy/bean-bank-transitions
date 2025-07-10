import fs from 'fs';
import path from 'path';

import {
  updateCustomerById,
  searchCustomers,
  getCustomerById,
  isKtpExistWithActiveState,
  isOfficerInOffice,
  generateCifNumber,
  insertCustomer
} from '../models/customerModel.js';

import { isValidStatusTransition, validateAge, isValidEmail, isValidKtp } from '../utils/validators.js';
import { validateRequiredFields } from '../validation/customerValidation.js';

// Fungsi bantu hapus file
const deleteUploadedFile = (filename) => {
  const filePath = path.join('public/uploads', filename);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
};


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
    
    // === Cek apakah ada file foto ===
    let photo_path = null;
    if (req.file) {
      photo_path = `/uploads/${req.file.filename}`;
    }

    await insertCustomer({ ...data, cif_number, photo_path });

    res.status(201).json({
      message: 'Customer created successfully',
      cif_number,
      data : { ...data, photo_path }
    });

  } catch (err) {
    res.status(500).json({ message: 'Insert failed', error: err.message });
  }
};


export const updateCustomerController = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const {
      ktp, email, date_of_birth, state,
      officer_code, office_code
    } = data;


    // ✅ Ambil data customer yang belum soft delete
    const existingCustomer = await getCustomerById(id);
    if (!existingCustomer) {
      if (req.file) deleteUploadedFile(req.file.filename);
      return res.status(404).json({ message: 'Customer tidak ditemukan atau sudah dihapus' });
    }

    // ✅ Validasi field wajib
    if (!validateRequiredFields(data)) {
      if (req.file) deleteUploadedFile(req.file.filename);
      return res.status(400).json({ message: 'Semua field wajib harus diisi' });
    }

    // ✅ Validasi KTP
    if (!isValidKtp(ktp)) {
      if (req.file) deleteUploadedFile(req.file.filename);
      return res.status(400).json({ message: 'KTP harus 16 digit angka' });
    }

    // ✅ Validasi umur
    if (!validateAge(date_of_birth)) {
      if (req.file) deleteUploadedFile(req.file.filename);
      return res.status(400).json({ message: 'Umur harus antara 17-55 tahun' });
    }

    // ✅ Validasi email (jika ada)
    if (email && !isValidEmail(email)) {
      if (req.file) deleteUploadedFile(req.file.filename);
      return res.status(400).json({ message: 'Format email tidak valid' });
    }

    // ✅ Validasi officer dan office
    const officerValid = await isOfficerInOffice(officer_code, office_code);
    if (!officerValid) {
      if (req.file) deleteUploadedFile(req.file.filename);
      return res.status(400).json({ message: 'Officer harus berasal dari office yang sama' });
    }

    // ✅ Validasi transisi status
    const currentStatus = existingCustomer.state;
    const newStatus = state;
    const customerId = parseInt(id, 10);

    if (newStatus && currentStatus !== newStatus) {
      const isAllowed = isValidStatusTransition(currentStatus, newStatus);
      if (!isAllowed) {
        if (req.file) deleteUploadedFile(req.file.filename);
        return res.status(400).json({
          message: `Transisi status dari ${currentStatus} ke ${newStatus} tidak diperbolehkan`
        });
      }

      // ✅ Jika pindah ke ACTIVE, pastikan KTP tidak dipakai customer ACTIVE lain
      if (newStatus === 'ACTIVE') {
        const isDuplicateKtp = await isKtpExistWithActiveState(ktp, customerId);
        if (isDuplicateKtp) {
          if (req.file) deleteUploadedFile(req.file.filename);
          return res.status(409).json({ message: 'KTP sudah digunakan oleh customer ACTIVE lain' });
        }
      }
    }


    // ✅ Tambahkan photo_path jika upload file
    if (req.file) {
      data.photo_path = `/uploads/${req.file.filename}`;
    }

    // ✅ Tambahkan updated_by dari login user (kalau ada)
    data.updated_by = req.user?.id || null;

    // ✅ Jalankan update (hanya jika deleted_at IS NULL, sudah ditangani di model)
    const affected = await updateCustomerById(id, data);

    if (affected === 0) {
      if (req.file) deleteUploadedFile(req.file.filename);
      return res.status(400).json({
        message: 'Update gagal. Customer mungkin sudah dihapus atau tidak ditemukan.'
      });
    }

    return res.status(200).json({
      message: 'Customer updated successfully',
      data
    });

  } catch (err) {
    if (req.file) deleteUploadedFile(req.file.filename);
    return res.status(500).json({ message: 'Update failed', error: err.message });
  }
};
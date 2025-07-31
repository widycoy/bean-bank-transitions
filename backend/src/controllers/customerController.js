import db from '../config/db.js';
import dayjs from 'dayjs';

import {
  insertCustomerStateHistory,
  isCityInProvince,
  isValidOfficer,
  isValidProvince,
  isValidCity,
  isValidMasterData,
  softDeleteCustomerById,
  updateCustomerById,
  searchCustomers,
  getCustomerById,
  isKtpExistWithActiveState,
  isKtpExistWithActiveStateEdit,
  isOfficerInOffice,
  generateCifNumber,
  insertCustomer
} from '../models/customerModel.js';

import { isValidStatusTransition, validateAge, isValidEmail, isValidKtp, isValidDate, isValidIndonesianPhone } from '../utils/validators.js';
import { validateRequiredFields } from '../validation/customerValidation.js';
import { deleteUploadedFile } from '../utils/fileUtils.js';

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
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const data = req.body;
    const { ktp, email, date_of_birth, officer_code, office_code } = data;

    // Validasi
    // Validation of KTP Format 
    if (!isValidKtp(ktp)) {
      if (req.file) deleteUploadedFile(req.file.filename);
      return res.status(400).json({ message: 'KTP harus 16 digit angka' });
    }

    // Empty Field Validation 
    if (!validateRequiredFields(data)) {
      if (req.file) deleteUploadedFile(req.file.filename);
      return res.status(400).json({ message: 'Field wajib tidak boleh kosong' });
    }

    // Validasi phone_number / phone_number validation
    if (!isValidIndonesianPhone(data.phone_number)) {
      if (req.file) deleteUploadedFile(req.file.filename);
      return res.status(400).json({ message: 'Nomor telepon tidak valid (harus format Indonesia)' });
    }


    // Validasi master data / master data validation
    const isGenderValid = await isValidMasterData('gender', data.gender_id);
    if (!isGenderValid) {
      if (req.file) deleteUploadedFile(req.file.filename);
      return res.status(400).json({ message: 'Gender tidak valid' });
    }

    const isMaritalValid = await isValidMasterData('marital-status', data.marital_status_id);
    if (!isMaritalValid) {
      if (req.file) deleteUploadedFile(req.file.filename);
      return res.status(400).json({ message: 'Status pernikahan tidak valid' });
    }

    const isResidentialValid = await isValidMasterData('residential-status', data.residential_status_id);
    if (!isResidentialValid) {
      if (req.file) deleteUploadedFile(req.file.filename);
      return res.status(400).json({ message: 'Status tempat tinggal tidak valid' });
    }

    const isIncomeValid = await isValidMasterData('income-range', data.income_range_id);
    if (!isIncomeValid) {
      if (req.file) deleteUploadedFile(req.file.filename);
      return res.status(400).json({ message: 'Range pendapatan tidak valid' });
    }

    // Validasi city / city validation
    const isCityValid = await isValidCity(data.city_code);
    if (!isCityValid) {
      if (req.file) deleteUploadedFile(req.file.filename);
      return res.status(400).json({ message: 'Kota tidak valid' });
    }

    // Validasi province / province validation
    const isProvinceValid = await isValidProvince(data.province_code);
    if (!isProvinceValid) {
      if (req.file) deleteUploadedFile(req.file.filename);
      return res.status(400).json({ message: 'Provinsi tidak valid' });
    }

    // Pastikan city_code berada di province_code yang sama / make sure city_code not in same province_code
    const isCityProvinceValid = await isCityInProvince(data.city_code, data.province_code);
    if (!isCityProvinceValid) {
      if (req.file) deleteUploadedFile(req.file.filename);
      return res.status(400).json({ message: 'Kota tidak sesuai dengan provinsi' });
    }


    // Validasi officer / officer validation
    const isOfficerValid = await isValidOfficer(data.officer_code);
    if (!isOfficerValid) {
      if (req.file) deleteUploadedFile(req.file.filename);
      return res.status(400).json({ message: 'Officer tidak valid' });
    }

    // Cek format date_of_birth / check format date_of_birth
    if (!isValidDate(date_of_birth)) {
      if (req.file) deleteUploadedFile(req.file.filename);
      return res.status(400).json({ message: 'Format tanggal lahir tidak valid (YYYY-MM-DD)' });
    }


    // Age Validation between 17 and 55 years
    if (!validateAge(date_of_birth)) {
      if (req.file) deleteUploadedFile(req.file.filename);
      return res.status(400).json({ message: 'Umur harus antara 17 dan 55 tahun' });
    }

    // Email Format Validation
    if (email && !isValidEmail(email)) {
      if (req.file) deleteUploadedFile(req.file.filename);
      return res.status(400).json({ message: 'Format email tidak valid' });
    }

    // Unique KTP Validation for ACTIVE status
    const ktpExists = await isKtpExistWithActiveState(ktp);
    if (ktpExists) {
      if (req.file) deleteUploadedFile(req.file.filename);
      return res.status(409).json({ message: 'KTP sudah digunakan oleh customer ACTIVE' });
    }

    // Validation Officer is in the same office
    const officerValid = await isOfficerInOffice(officer_code, office_code);
    if (!officerValid) {
      if (req.file) deleteUploadedFile(req.file.filename);
      return res.status(400).json({ message: 'Officer harus berasal dari office yang sama' });
    }

     // Secure Generate CIF with transaction 
    const cif_number = await generateCifNumber(office_code, connection);
    
    // === Check if there is a photo file ===
    let photo_path = null;
    if (req.file) {
      photo_path = `/uploads/${req.file.filename}`;
    }
    
    // Insert customer (with separate function)
    await insertCustomer(connection, { ...data, cif_number, photo_path });
    
    // Get ID new customer
    const [rows] = await connection.query(
      'SELECT id FROM customer WHERE cif_number = ?', 
      [cif_number]
    );
    const customerId = rows[0]?.id;


    // Insert history status awal: NULL → PENDING
    await insertCustomerStateHistory(customerId, null, 'PENDING', officer_code, connection);

    // Commit transaction 
    await connection.commit();

    // Respond to client 
    res.status(201).json({
      message: 'Customer created successfully',
      cif_number,
      data : { ...data, photo_path }
    });

  } catch (err) {
    await connection.rollback();
    if (req.file) deleteUploadedFile(req.file.filename);

    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        message: 'Duplicate CIF number detected',
        error: err.message
      });
    }
    res.status(500).json({ message: 'Insert failed', error: err.message });
  } finally {
    connection.release();
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


    // ✅ Retrieve customer data that has not been soft deleted / Ambil data customer yang belum soft delete
    const existingCustomer = await getCustomerById(id);
    if (!existingCustomer) {
      if (req.file) deleteUploadedFile(req.file.filename);
      return res.status(404).json({ message: 'Customer tidak ditemukan atau sudah dihapus' });
    }

    // Cek apakah KTP berubah / check if ktp changed
    if (ktp && ktp !== existingCustomer.ktp) {
      if (req.file) deleteUploadedFile(req.file.filename);
      return res.status(400).json({ message: 'KTP tidak boleh diubah' });
    }

    // Cek apakah cif_number berubah / check if cig_number changed
    if (data.cif_number && data.cif_number !== existingCustomer.cif_number) {
      if (req.file) deleteUploadedFile(req.file.filename);
      return res.status(400).json({ message: 'CIF Number tidak boleh diubah' });
    }

    // Cek apakah gender_id berubah / check if gender_id changed
    if (data.gender_id && data.gender_id != existingCustomer.gender_id) {
      if (req.file) deleteUploadedFile(req.file.filename);
      return res.status(400).json({ message: 'gender_id tidak boleh diubah' });
    }


    // Cek apakah date_of_birth berubah / check if date_of_birth changed
    const dbDate = dayjs(existingCustomer.date_of_birth).format('YYYY-MM-DD');
    const bodyDate = dayjs(data.date_of_birth).format('YYYY-MM-DD');
    if (data.date_of_birth && bodyDate !== dbDate) {
      if (req.file) deleteUploadedFile(req.file.filename);
      return res.status(400).json({ message: 'Tanggal lahir (date_of_birth) tidak boleh diubah' });
    }

    // Cek apakah place_of_birth berubah /  check if place_of_birth changed
    if (data.place_of_birth && data.place_of_birth !== existingCustomer.place_of_birth) {
      if (req.file) deleteUploadedFile(req.file.filename);
      return res.status(400).json({ message: 'Tempat lahir (place_of_birth) tidak boleh diubah' });
    }



    // required field validation
    if (!validateRequiredFields(data)) {
      if (req.file) deleteUploadedFile(req.file.filename);
      return res.status(400).json({ message: 'Semua field wajib harus diisi' });
    }

    // Validasi phone_number
    if (!isValidIndonesianPhone(data.phone_number)) {
      if (req.file) deleteUploadedFile(req.file.filename);
      return res.status(400).json({ message: 'Nomor telepon tidak valid (harus format Indonesia)' });
    }


    // Validasi master data
    const isGenderValid = await isValidMasterData('gender', data.gender_id);
    if (!isGenderValid) {
      if (req.file) deleteUploadedFile(req.file.filename);
      return res.status(400).json({ message: 'Gender tidak valid' });
    }

    const isMaritalValid = await isValidMasterData('marital-status', data.marital_status_id);
    if (!isMaritalValid) {
      if (req.file) deleteUploadedFile(req.file.filename);
      return res.status(400).json({ message: 'Status pernikahan tidak valid' });
    }

    const isResidentialValid = await isValidMasterData('residential-status', data.residential_status_id);
    if (!isResidentialValid) {
      if (req.file) deleteUploadedFile(req.file.filename);
      return res.status(400).json({ message: 'Status tempat tinggal tidak valid' });
    }

    const isIncomeValid = await isValidMasterData('income-range', data.income_range_id);
    if (!isIncomeValid) {
      if (req.file) deleteUploadedFile(req.file.filename);
      return res.status(400).json({ message: 'Range pendapatan tidak valid' });
    }

    const isCityValid = await isValidCity(data.city_code);
    if (!isCityValid) {
      if (req.file) deleteUploadedFile(req.file.filename);
      return res.status(400).json({ message: 'Kota tidak valid' });
    }

    const isProvinceValid = await isValidProvince(data.province_code);
    if (!isProvinceValid) {
      if (req.file) deleteUploadedFile(req.file.filename);
      return res.status(400).json({ message: 'Provinsi tidak valid' });
    }

    const isCityProvinceValid = await isCityInProvince(data.city_code, data.province_code);
    if (!isCityProvinceValid) {
      if (req.file) deleteUploadedFile(req.file.filename);
      return res.status(400).json({ message: 'Kota tidak sesuai dengan provinsi' });
    }


    const isOfficerValid = await isValidOfficer(data.officer_code);
    if (!isOfficerValid) {
      if (req.file) deleteUploadedFile(req.file.filename);
      return res.status(400).json({ message: 'Officer tidak valid' });
    }



    // KTP validation
    if (!isValidKtp(ktp)) {
      if (req.file) deleteUploadedFile(req.file.filename);
      return res.status(400).json({ message: 'KTP harus 16 digit angka' });
    }

    // Cek format date_of_birth
    if (!isValidDate(date_of_birth)) {
      if (req.file) deleteUploadedFile(req.file.filename);
      return res.status(400).json({ message: 'Format tanggal lahir tidak valid (YYYY-MM-DD)' });
    }


    //  date of birth validation
    if (!validateAge(date_of_birth)) {
      if (req.file) deleteUploadedFile(req.file.filename);
      return res.status(400).json({ message: 'Umur harus antara 17-55 tahun' });
    }

    // email validation (if any)
    if (email && !isValidEmail(email)) {
      if (req.file) deleteUploadedFile(req.file.filename);
      return res.status(400).json({ message: 'Format email tidak valid' });
    }

    // officer and office validation
    const officerValid = await isOfficerInOffice(officer_code, office_code);
    if (!officerValid) {
      if (req.file) deleteUploadedFile(req.file.filename);
      return res.status(400).json({ message: 'Officer harus berasal dari office yang sama' });
    }

    // Transtition status validation
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

      // If you move to ACTIVE, make sure your KTP is not used by another ACTIVE customer.
      if (newStatus === 'ACTIVE') {
        const isDuplicateKtp = await isKtpExistWithActiveStateEdit(ktp, customerId);
        if (isDuplicateKtp) {
          if (req.file) deleteUploadedFile(req.file.filename);
          return res.status(409).json({ message: 'KTP sudah digunakan oleh customer ACTIVE lain' });
        }
      }
    }

    // Add photo_path if uploading a file
    if (req.file) {
      data.photo_path = `/uploads/${req.file.filename}`;
    }

    // Add updated_by from logged in user (if any)
    data.updated_by = req.user?.id || null;

    // Jika state diubah menjadi CLOSED → soft delete otomatis / If the state is changed to CLOSED → automatic soft delete
    if (newStatus === 'CLOSED') {
      data.deleted_at = new Date();
      data.state = 'CLOSED';
    }

    // Run update (only if deleted_at IS NULL, already handled in the model)
    const affected = await updateCustomerById(id, data);

    if (affected === 0) {
      if (req.file) deleteUploadedFile(req.file.filename);
      return res.status(400).json({
        message: 'Update gagal. Customer mungkin sudah dihapus atau tidak ditemukan.'
      });
    }

    // Catat ke history jika state berubah dan tidak sama / Record to history if state changes and is not the same
    if (newStatus && currentStatus !== newStatus) {
      await insertCustomerStateHistory(
        id,
        currentStatus,  // old_state
        newStatus,      // new_state
        officer_code
      );
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

// Soft delete customer by ID
export const deleteCustomerController = async (req, res) => {
  try {
    const { id } = req.params;

    // Ambil data customer sebelum dihapus / Retrieve customer data before deletion
    const existingCustomer = await getCustomerById(id);
    if (!existingCustomer) {
      return res.status(404).json({ message: 'Customer tidak ditemukan atau sudah dihapus' });
    }

    // Lakukan soft delete / Perform a soft delete
    const deleted = await softDeleteCustomerById(id);
    if (!deleted) {
      return res.status(400).json({ message: 'Gagal menghapus customer' });
    }

    // Catat perubahan status ke customer_state_history / Record status changes to customer_state_history
    await insertCustomerStateHistory(
      id,
      existingCustomer.state, // old_state
      'CLOSED',               // new_state
      existingCustomer.officer_code
    );

    // Response sukses / Response successful
    res.status(200).json({ message: 'Customer berhasil dihapus (soft delete)' });

  } catch (err) {
    res.status(500).json({ message: 'Gagal menghapus customer', error: err.message });
  }
};



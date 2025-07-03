import {
  isKtpExistWithActiveState,
  isOfficerInOffice,
  generateCifNumber,
  insertCustomer
} from '../models/customerModel.js';

import dayjs from 'dayjs';

export const submitCustomer = async (req, res) => {
  try {
    const {
      ktp,
      name,
      address,
      city_code,
      province_code,
      phone_number,
      mother_name,
      marital_status_id,
      gender_id,
      date_of_birth,
      place_of_birth,
      occupation,
      income_range_id,
      email,
      residential_status_id,
      officer_code,
      office_code
    } = req.body;

    // === VALIDASI DATA ===
    if (!ktp || ktp.length !== 16 || !/^\d+$/.test(ktp))
      return res.status(400).json({ message: 'KTP harus 16 digit angka' });

    if (!name || !address || !city_code || !province_code || !phone_number || !mother_name || !marital_status_id || !gender_id || !date_of_birth || !place_of_birth || !occupation || !income_range_id || !residential_status_id || !officer_code || !office_code) {
      return res.status(400).json({ message: 'Field wajib tidak boleh kosong' });
    }

    const age = dayjs().diff(dayjs(date_of_birth), 'year');
    if (age < 17 || age > 55)
      return res.status(400).json({ message: 'Umur harus antara 17 dan 55 tahun' });

    const validEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !validEmailRegex.test(email))
      return res.status(400).json({ message: 'Format email tidak valid' });

    const ktpExists = await isKtpExistWithActiveState(ktp);
    if (ktpExists)
      return res.status(409).json({ message: 'KTP sudah digunakan oleh customer ACTIVE' });

    const officerValid = await isOfficerInOffice(officer_code, office_code);
    if (!officerValid)
      return res.status(400).json({ message: 'Officer harus berasal dari office yang sama' });

    // === GENERATE CIF & INSERT ===
    const cif_number = await generateCifNumber(office_code);

    await insertCustomer({
      cif_number,
      ktp,
      name,
      address,
      city_code,
      province_code,
      phone_number,
      mother_name,
      marital_status_id,
      gender_id,
      date_of_birth,
      place_of_birth,
      occupation,
      income_range_id,
      email,
      residential_status_id,
      officer_code,
      office_code
    });

    res.status(201).json({ message: 'Customer created successfully', cif_number });

  } catch (err) {
    res.status(500).json({ message: 'Insert failed', error: err.message });
  }
};

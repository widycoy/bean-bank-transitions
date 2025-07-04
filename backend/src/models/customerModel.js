import db from '../config/db.js';

// Cek apakah KTP sudah digunakan oleh customer dengan status ACTIVE
export const isKtpExistWithActiveState = async (ktp) => {
  const query = `
    SELECT COUNT(*) AS total
    FROM customer
    WHERE ktp = ? AND state = 'ACTIVE'
  `;
  const [rows] = await db.query(query, [ktp]);
  return rows[0].total > 0;
};

// Cek apakah officer berasal dari office yang sama
export const isOfficerInOffice = async (officerCode, officeCode) => {
  const query = `
    SELECT COUNT(*) AS total
    FROM officer
    WHERE officer_code = ? AND office_code = ?
  `;
  const [rows] = await db.query(query, [officerCode, officeCode]);
  return rows[0].total > 0;
};

// Generate nomor CIF: 4 digit kode kantor + 5 digit increment
export const generateCifNumber = async (officeCode) => {
  const query = `
    SELECT COUNT(*) AS total
    FROM customer
    WHERE office_code = ?
  `;
  const [rows] = await db.query(query, [officeCode]);
  const nextIncrement = (rows[0].total || 0) + 1;
  return `${officeCode}${String(nextIncrement).padStart(5, '0')}`;
};

// Insert customer baru ke dalam database
export const insertCustomer = async (data) => {
  const {
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
  } = data;

  const query = `
    INSERT INTO customer (
      cif_number, ktp, name, address, city_code, province_code,
      phone_number, mother_name, marital_status_id, gender_id,
      date_of_birth, place_of_birth, occupation, income_range_id,
      email, residential_status_id, officer_code, office_code, state
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    cif_number, ktp, name, address, city_code, province_code,
    phone_number, mother_name, marital_status_id, gender_id,
    date_of_birth, place_of_birth, occupation, income_range_id,
    email, residential_status_id, officer_code, office_code, 'PENDING'
  ];

  await db.query(query, values);
};

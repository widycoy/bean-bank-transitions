import db from '../config/db.js';

export const isKtpExistWithActiveState = async (ktp) => {
  const sql1 = `SELECT COUNT(*) AS total FROM customer WHERE ktp = ? AND state = "ACTIVE"`;
  const [rows] = await db.query(sql1,[ktp]);
  return rows[0].total > 0;
  
};


export const isOfficerInOffice = async (officerCode, officeCode) => {
  const sql2 = 'SELECT COUNT(*) AS total FROM officer WHERE officer_code = ? AND office_code = ?';
  const [rows] = await db.query(sql2,[officerCode, officeCode]
  );
  return rows[0].total > 0;
};

export const generateCifNumber = async (officeCode) => {
  const [rows] = await db.query(
    'SELECT COUNT(*) AS total FROM customer WHERE office_code = ?',
    [officeCode]
  );
  const nextIncrement = (rows[0].total || 0) + 1;
  return `${officeCode}${String(nextIncrement).padStart(5, '0')}`;
};

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

  await db.query(`
    INSERT INTO customer (
      cif_number, ktp, name, address, city_code, province_code,
      phone_number, mother_name, marital_status_id, gender_id,
      date_of_birth, place_of_birth, occupation, income_range_id,
      email, residential_status_id, officer_code, office_code, state
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    cif_number, ktp, name, address, city_code, province_code,
    phone_number, mother_name, marital_status_id, gender_id,
    date_of_birth, place_of_birth, occupation, income_range_id,
    email, residential_status_id, officer_code, office_code, 'PENDING'
  ]);
};

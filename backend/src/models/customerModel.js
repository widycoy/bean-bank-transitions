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


// Ambil data semua customer dari database
export const getAllCustomers = async () => {
  const query = `SELECT
  c.id,
  c.cif_number,
  c.name,
  c.ktp,
  c.date_of_birth,
  c.phone_number,
  master_gender.description AS gender,
  master_marital.description AS marital_status,
  master_income.description AS income_range,
  master_residential.description AS residential_status,
  o.name AS officer_name,
  f.name AS office_name,
  s.city_name AS city_name,
  p.province_name AS province_name,
  c.state
FROM customer AS c
LEFT JOIN master_data AS master_gender
  ON c.gender_id = master_gender.id
  AND master_gender.entity_type_name = 'gender'

LEFT JOIN master_data AS master_marital
  ON c.marital_status_id = master_marital.id
  AND master_marital.entity_type_name = 'marital-status'

LEFT JOIN master_data AS master_income
  ON c.income_range_id = master_income.id
  AND master_income.entity_type_name = 'income-range'

LEFT JOIN master_data AS master_residential
  ON c.residential_status_id = master_residential.id
  AND master_residential.entity_type_name = 'residential-status'

LEFT JOIN officer AS o
  ON c.officer_code = o.officer_code

LEFT JOIN office AS f
  ON c.office_code = f.office_code

LEFT JOIN city As s
  ON c.city_code = s.city_code
  
LEFT JOIN province As p
  ON c.province_code = p.province_code

ORDER BY c.id ASC;`

  const [rows] = await db.query(query);
  return rows;
};


// Ambil data berdasarkan id customer dari database
export const getCustomerById = async (id) => {
  const query = `SELECT
  c.id,
  c.cif_number,
  c.name,
  c.ktp,
  c.date_of_birth,
  c.phone_number,
  master_gender.description AS gender,
  master_marital.description AS marital_status,
  master_income.description AS income_range,
  master_residential.description AS residential_status,
  o.name AS officer_name,
  f.name AS office_name,
  s.city_name AS city_name,
  p.province_name AS province_name,
  c.state
FROM customer AS c
LEFT JOIN master_data AS master_gender
  ON c.gender_id = master_gender.id
  AND master_gender.entity_type_name = 'gender'

LEFT JOIN master_data AS master_marital
  ON c.marital_status_id = master_marital.id
  AND master_marital.entity_type_name = 'marital-status'

LEFT JOIN master_data AS master_income
  ON c.income_range_id = master_income.id
  AND master_income.entity_type_name = 'income-range'

LEFT JOIN master_data AS master_residential
  ON c.residential_status_id = master_residential.id
  AND master_residential.entity_type_name = 'residential-status'

LEFT JOIN officer AS o
  ON c.officer_code = o.officer_code

LEFT JOIN office AS f
  ON c.office_code = f.office_code

LEFT JOIN city As s
  ON c.city_code = s.city_code
  
LEFT JOIN province As p
  ON c.province_code = p.province_code

WHERE c.id = ?

ORDER BY c.id ASC;`

  const [rows] = await db.query(query, [id]);
  return rows[0] || null;
};
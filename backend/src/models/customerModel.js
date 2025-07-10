import db from '../config/db.js';

// Cek apakah KTP sudah digunakan oleh customer dengan status ACTIVE
// export const isKtpExistWithActiveState = async (ktp) => {
//   const query = `
//     SELECT COUNT(*) AS total
//     FROM customer
//     WHERE ktp = ? AND state = 'ACTIVE'
//   `;
//   const [rows] = await db.query(query, [ktp]);
//   return rows[0].total > 0;
// };

export const isKtpExistWithActiveState = async (ktp, excludeCustomerId = null) => {
  let query = `
    SELECT id
    FROM customer
    WHERE ktp = ? AND state = 'ACTIVE' AND deleted_at IS NULL
  `;
  const params = [ktp];

  if (excludeCustomerId) {
    query += ' AND id != ?';
    params.push(excludeCustomerId);
  }

  const [rows] = await db.query(query, params);
  // return rows.length > 0; // ✅ Return boolean 
  return rows; // Array of customers with same KTP
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
    office_code,
    photo_path
  } = data;

  const query = `
    INSERT INTO customer (
      cif_number, ktp, name, address, city_code, province_code,
      phone_number, mother_name, marital_status_id, gender_id,
      date_of_birth, place_of_birth, occupation, income_range_id,
      email, residential_status_id, officer_code, office_code, state, photo_path
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    cif_number, ktp, name, address, city_code, province_code,
    phone_number, mother_name, marital_status_id, gender_id,
    date_of_birth, place_of_birth, occupation, income_range_id,
    email, residential_status_id, officer_code, office_code, 'PENDING',
    photo_path
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
  c.photo_path,
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
  AND c.deleted_at IS NULL

ORDER BY c.id ASC;`

  const [rows] = await db.query(query, [id]);
  return rows[0] || null;
};

// Fungsi Search & Pagination
export const searchCustomers = async (filters) => {
  const {
    cif_number,
    ktp,
    name,
    office_name,
    state,
    page = 1,
    limit = 10,
    sortBy = 'c.id',
    sortOrder = 'ASC'
  } = filters;

  let baseWhere = 'WHERE c.deleted_at IS NULL';
  const params = [];

  // Filter builder
  if (cif_number) {
    baseWhere += ' AND c.cif_number LIKE ?';
    params.push(`%${cif_number}%`);
  }

  if (ktp) {
    baseWhere += ' AND c.ktp LIKE ?';
    params.push(`%${ktp}%`);
  }

  if (name) {
    baseWhere += ' AND c.name LIKE ?';
    params.push(`%${name}%`);
  }

  if (office_name) {
    baseWhere += ' AND f.name LIKE ?';
    params.push(`%${office_name}%`);
  }

  if (state) {
    baseWhere += ' AND c.state = ?';
    params.push(state);
  }

  // Query total data
  const countQuery = `
    SELECT COUNT(*) AS totalCount
    FROM customer c
    LEFT JOIN officer o ON c.officer_code = o.officer_code
    LEFT JOIN office f ON c.office_code = f.office_code
    ${baseWhere}
  `;
  const [countResult] = await db.query(countQuery, params);
  const totalCount = countResult[0].totalCount;

  // Query data dengan pagination
  const dataQuery = `
    SELECT 
      c.id, c.cif_number,c.photo_path, c.name, c.ktp, c.state,
      o.name AS officer_name,
      f.name AS office_name
    FROM customer c
    LEFT JOIN officer o ON c.officer_code = o.officer_code
    LEFT JOIN office f ON c.office_code = f.office_code
    ${baseWhere}
    ORDER BY ${sortBy} ${sortOrder}
    LIMIT ? OFFSET ?
  `;
  const offset = (page - 1) * limit;
  const [rows] = await db.query(dataQuery, [...params, limit, offset]);

  return {
    data: rows,
    totalCount
  };
};


export const updateCustomerById = async (id, data) => {
  const fields = [];
  const values = [];

 // Hindari update kolom typo
  delete data.update_at;
  delete data.updated_at;

  for (const [key, value] of Object.entries(data)) {
    fields.push(`${key} = ?`);
    values.push(value);
  }

  const sql = `UPDATE customer SET ${fields.join(', ')} WHERE id = ? AND deleted_at IS NULL`;
  
  const [result] = await db.query(sql, [...values, id]);

  return result.affectedRows; // ✅ kembalikan jumlah baris yang diupdate
};

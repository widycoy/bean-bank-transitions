import db from '../config/db.js';

// Cek apakah KTP sudah digunakan oleh customer dengan status ACTIVE / Check whether the KTP has been used by a customer with ACTIVE status
export const isKtpExistWithActiveState = async (ktp) => {
  const query = `
    SELECT COUNT(*) AS total
    FROM customer
    WHERE ktp = ? AND state = 'ACTIVE'
  `;
  const [rows] = await db.query(query, [ktp]);
  return rows[0].total > 0;
};

export const isKtpExistWithActiveStateEdit = async (ktp, excludeCustomerId = null) => {
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
   return rows.length > 0; // ✅ Return boolean 
 // return rows; // Array of customers with same KTP
};


// Cek apakah id valid pada tabel master_data untuk entitas tertentu / Check if the id is valid in the master_data table for a given entity.
export const isValidMasterData = async (entityType, id) => {
  const query = `
    SELECT COUNT(*) AS total
    FROM master_data
    WHERE entity_type_name = ? AND id = ?
  `;
  const [rows] = await db.query(query, [entityType, id]);
  return rows[0].total > 0;
};

// Cek city_code valid / check city_code is valid
export const isValidCity = async (cityCode) => {
  const query = `SELECT COUNT(*) AS total FROM city WHERE city_code = ?`;
  const [rows] = await db.query(query, [cityCode]);
  return rows[0].total > 0;
};

// Cek province_code valid / check provinde_code is valid
export const isValidProvince = async (provinceCode) => {
  const query = `SELECT COUNT(*) AS total FROM province WHERE province_code = ?`;
  const [rows] = await db.query(query, [provinceCode]);
  return rows[0].total > 0;
};

// Cek apakah city_code berada di province_code yang sama / Check whether the city_code is in the same province_code
export const isCityInProvince = async (cityCode, provinceCode) => {
  const query = `
    SELECT COUNT(*) AS total
    FROM city
    WHERE city_code = ? AND province_code = ?
  `;
  const [rows] = await db.query(query, [cityCode, provinceCode]);
  return rows[0].total > 0;
};


// Cek officer_code valid / Check officer_code is valid
export const isValidOfficer = async (officerCode) => {
  const query = `SELECT COUNT(*) AS total FROM officer WHERE officer_code = ?`;
  const [rows] = await db.query(query, [officerCode]);
  return rows[0].total > 0;
};


// Cek apakah officer berasal dari office yang sama / Check whether the officer is from the same office
export const isOfficerInOffice = async (officerCode, officeCode) => {
  const query = `
    SELECT COUNT(*) AS total
    FROM officer
    WHERE officer_code = ? AND office_code = ?
  `;
  const [rows] = await db.query(query, [officerCode, officeCode]);
  return rows[0].total > 0;
};


// models/customerModel.js
export const generateCifNumber = async (officeCode, connection) => {
  // Ambil nomor increment terbesar untuk office ini dan lock baris agar tidak bentrok / Take the largest increment number for this office and lock the row to prevent conflicts.
  const [rows] = await connection.query(`
    SELECT MAX(CAST(SUBSTRING(cif_number, 5) AS UNSIGNED)) AS max_increment
    FROM customer
    WHERE office_code = ?
    FOR UPDATE
  `, [officeCode]);

  // Hitung nomor berikutnya / Calculate the next number
  const nextIncrement = (rows[0].max_increment || 0) + 1;

  // Format: 4 digit office_code + 5 digit increment
  return `${officeCode}${String(nextIncrement).padStart(5, '0')}`;
};



//Insert new customer into the database
/**
 * Insert customer baru ke database.
 * @param {object} connection - Koneksi MySQL (transaction) atau null untuk pakai pool default.
 * @param {object} customer - Data customer yang sudah divalidasi.
 */
export const insertCustomer = async (connection, customer) => {
  const sql = `
    INSERT INTO customer 
    (cif_number, office_code, officer_code, name, address, ktp, email, date_of_birth, place_of_birth, occupation,
     phone_number, mother_name, gender_id, marital_status_id, income_range_id, residential_status_id,
     city_code, province_code, state, photo_path, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, NOW(), NOW())
  `;

  const params = [
    customer.cif_number,
    customer.office_code,
    customer.officer_code,
    customer.name,
    customer.address,
    customer.ktp,
    customer.email || null,
    customer.date_of_birth,
    customer.place_of_birth,
    customer.occupation,
    customer.phone_number,
    customer.mother_name,
    customer.gender_id,
    customer.marital_status_id,
    customer.income_range_id,
    customer.residential_status_id,
    customer.city_code,
    customer.province_code,
    customer.photo_path || null
  ];

  // Gunakan koneksi transaction jika ada, kalau tidak pakai pool global / Use transaction connection if available, otherwise use global pool
  if (connection) {
    return connection.query(sql, params);
  } else {
    return db.query(sql, params);
  }
};



// Ambil data berdasarkan id customer dari database / Retrieve data based on customer id from database
export const getCustomerById = async (id) => {
  const query = `SELECT
  c.*,
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

// Fungsi Search & Pagination / Search and Pagination Function
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

  // Query data dengan pagination / Query data with pagination
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

//for update customer data
export const updateCustomerById = async (id, data) => {
  const fields = [];
  const values = [];

 // Hindari update kolom typo / Avoid typo column updates
  delete data.update_at;
  delete data.updated_at;

  for (const [key, value] of Object.entries(data)) {
    fields.push(`${key} = ?`);
    values.push(value);
  }

  const sql = `UPDATE customer SET ${fields.join(', ')} WHERE id = ? AND deleted_at IS NULL`;
  
  const [result] = await db.query(sql, [...values, id]);

  return result.affectedRows; // kembalikan jumlah baris yang diupdate / return the number of rows updated
};


// Soft delete customer by ID (set deleted_at timestamp)
export const softDeleteCustomerById = async (id) => {
  const query = `
    UPDATE customer
    SET deleted_at = NOW(),
        state = 'CLOSED'
    WHERE id = ? AND deleted_at IS NULL
  `;
  const [result] = await db.query(query, [id]);
  return result.affectedRows > 0;
};

// Insert history customer status
export const insertCustomerStateHistory = async (
  customerId,
  oldState,
  newState,
  officerCode,
  connection = db // default pakai pool global kalau tidak ada transaction / default use global pool if there are no transactions
) => {
  const sql = `
    INSERT INTO customer_state_history
    (customer_id, old_state, new_state, officer_code, created_at)
    VALUES (?, ?, ?, ?, NOW())
  `;
  return connection.query(sql, [customerId, oldState, newState, officerCode]);
};



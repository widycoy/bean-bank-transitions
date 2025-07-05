export const validateRequiredFields = (body) => {
  const requiredFields = [
    'ktp', 'name', 'address', 'city_code', 'province_code',
    'phone_number', 'mother_name', 'marital_status_id', 'gender_id',
    'date_of_birth', 'place_of_birth', 'occupation', 'income_range_id',
    'residential_status_id', 'officer_code', 'office_code'
  ];

  const missing = requiredFields.filter(field => !body[field]);
  return missing.length === 0;
};

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



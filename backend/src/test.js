import { isKtpExistWithActiveState } from './models/customerModel.js';

const test = async () => {
  const result = await isKtpExistWithActiveState('1234567890129832');
  console.log('Apakah KTP sudah ada dan status ACTIVE? =>', result);
  // console.log(`KTP: ${ktp}, Total ditemukan: ${rows[0].total}`);
};

test();

// export const isKtpExistWithActiveState = async (ktp) => {
//   const sql1 = 'SELECT COUNT(*) AS total FROM customer WHERE ktp = ? AND state = "ACTIVE"';
//   const [rows] = await db.query(sql1, [ktp]);

//   console.log(`KTP: ${ktp}, Total ditemukan: ${rows[0].total}`);
  
//   return rows[0].total > 0;
// };

// test();


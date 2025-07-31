// utils/validators.js
import dayjs from 'dayjs';

// validasi email 
// export const isValidEmail = (email) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
export const isValidEmail = (email) => {
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!regex.test(email)) return false;

  // Ambil TLD dan validasi hanya TLD yang diizinkan
  const allowedTLD = ['com', 'net', 'org', 'id', 'co', 'gov', 'edu', 'io'];
  const tld = email.split('.').pop().toLowerCase();
  return allowedTLD.includes(tld);
};


// Cek apakah date string valid (format YYYY-MM-DD dan tanggal valid)
export const isValidDate = (dateString) => {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false; // format salah

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return false; // bukan tanggal valid

  // Pastikan tanggal di string sama dengan hasil format date (menghindari auto-correct JS)
  const [year, month, day] = dateString.split('-').map(Number);
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() + 1 === month &&
    date.getUTCDate() === day
  );
};


// validasi umur
export const validateAge = (date_of_birth) => {
  const age = dayjs().diff(dayjs(date_of_birth), 'year');
  return age >= 17 && age <= 55;
};

// Validasi nomor telepon Indonesia (mobile atau home)
export const isValidIndonesianPhone = (phone) => {
  if (!phone) return false;

  // Hilangkan spasi dan strip
  const cleaned = phone.replace(/[\s-]/g, '');

  // Mobile (08 atau +628)
  const mobileRegex = /^(?:\+62|62|0)8[1-9][0-9]{7,10}$/;

  // Home phone (02x, 03x, 04x, 05x, 06x, 07x, 09x)
  const homeRegex = /^(?:\+62|62|0)[2-9][0-9]{7,11}$/;

  return mobileRegex.test(cleaned) || homeRegex.test(cleaned);
};


// Validasi format KTP
export const isValidKtp = (ktp) => {
  return ktp && /^\d{16}$/.test(ktp);
};

// validasi status transititon
export const isValidStatusTransition = (currentStatus, newStatus) => {
  const allowedTransitions = {
    PENDING: ['ACTIVE', 'CLOSED'],
    ACTIVE: ['CLOSED'],
    CLOSED: []
  };

  return allowedTransitions[currentStatus]?.includes(newStatus);
};
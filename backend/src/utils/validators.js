// utils/validators.js
import dayjs from 'dayjs';

// validasi email 
export const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// validasi umur
export const validateAge = (date_of_birth) => {
  const age = dayjs().diff(dayjs(date_of_birth), 'year');
  return age >= 17 && age <= 55;
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
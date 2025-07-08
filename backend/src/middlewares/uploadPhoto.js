import multer from 'multer';
import path from 'path';
import fs from 'fs';

//  Ensure the uploads folder exists
const uploadDir = path.resolve('public/uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Hanya file JPG/PNG yang diizinkan'), false);
  }
};

export const uploadPhoto = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 } // max 2MB
}).single('photo_path'); // field name: photo

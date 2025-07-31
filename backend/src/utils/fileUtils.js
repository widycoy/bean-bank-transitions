import fs from 'fs';
import path from 'path';

// File delete helper function / Fungsi bantu hapus file
export const deleteUploadedFile = (filename) => {
  const filePath = path.join('public/uploads', filename);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
};
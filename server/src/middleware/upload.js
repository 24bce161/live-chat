import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * File filter — allow common image and document types.
 * Both the extension AND the MIME type must be allowed, because the browser
 * sets the MIME type and it can be faked.
 */
const fileFilter = (req, file, cb) => {
  const allowedExtensions = /^\.(jpeg|jpg|png|gif|webp|pdf|doc|docx|zip)$/;
  const allowedMimeTypes = /^(image\/(jpeg|png|gif|webp)|application\/(pdf|msword|zip|x-zip-compressed|vnd\.openxmlformats-officedocument\.wordprocessingml\.document))$/;

  const extOk = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
  const mimeOk = allowedMimeTypes.test(file.mimetype);

  if (extOk && mimeOk) {
    cb(null, true);
  } else {
    const error = new Error('Invalid file type. Allowed: images, PDF, DOC, DOCX, ZIP');
    error.statusCode = 400;
    cb(error, false);
  }
};

/**
 * Files are always saved to the local uploads/ folder first.
 * If UPLOAD_PROVIDER=cloudinary, the upload route then moves them to Cloudinary.
 */
const uploadsDir = path.resolve(__dirname, '../../uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadsDir);
  },
  filename(req, file, cb) {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname).toLowerCase()}`);
  }
});

export const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter
});

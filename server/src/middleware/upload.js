import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * File filter — allow common image and document types.
 */
const fileFilter = (req, file, cb) => {
  const allowedExtensions = /jpeg|jpg|png|gif|webp|pdf|doc|docx|zip/;
  const allowedMimeTypes = /image\/(jpeg|jpg|png|gif|webp)|application\/(pdf|msword|zip|x-zip-compressed)|application\/vnd\.openxmlformats/;
  
  const extOk = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
  const mimeOk = allowedMimeTypes.test(file.mimetype);

  if (extOk || mimeOk) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Allowed: images, PDF, DOC, DOCX, ZIP'), false);
  }
};

/**
 * Storage configuration — uses Cloudinary if UPLOAD_PROVIDER=cloudinary,
 * otherwise saves to local uploads/ directory.
 */
let storage;

if (process.env.UPLOAD_PROVIDER === 'cloudinary') {
  // Dynamic import to avoid errors when cloudinary packages aren't installed
  try {
    const { v2: cloudinary } = await import('cloudinary');
    const { CloudinaryStorage } = await import('multer-storage-cloudinary');
    
    storage = new CloudinaryStorage({
      cloudinary,
      params: {
        folder: 'livechat',
        resource_type: 'auto'
      }
    });
  } catch (err) {
    console.warn('[Upload] Cloudinary packages not installed. Falling back to local storage.');
    console.warn('[Upload] Install multer-storage-cloudinary if you want cloud uploads.');
    storage = null; // Will be set below
  }
}

if (!storage) {
  // Local disk storage as default/fallback
  const uploadsDir = path.resolve(__dirname, '../../uploads');
  
  storage = multer.diskStorage({
    destination(req, file, cb) {
      cb(null, uploadsDir);
    },
    filename(req, file, cb) {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
    }
  });
}

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter
});

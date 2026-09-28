import express from 'express';
import fs from 'fs';
import { upload } from '../middleware/upload.js';
import { protect } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import cloudinary from '../config/cloudinary.js';

const router = express.Router();

router.post('/', protect, upload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  let fileUrl;

  if (cloudinary) {
    // Production: move the file to Cloudinary. Most hosts wipe the local disk on every deploy.
    try {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'livechat',
        resource_type: 'auto'
      });
      fileUrl = result.secure_url;
    } finally {
      // The local copy isn't needed any more (whether the upload worked or not)
      fs.unlink(req.file.path, () => {});
    }
  } else {
    // Development: serve the file from this server's /uploads folder
    fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  }

  res.status(200).json({
    url: fileUrl,
    type: req.file.mimetype.startsWith('image/') ? 'image' : 'file',
    name: req.file.originalname
  });
}));

export default router;

import express from 'express';
import { upload } from '../middleware/upload.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/', protect, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    let fileUrl = req.file.path;
    if (process.env.UPLOAD_PROVIDER === 'local') {
      fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    }

    res.status(200).json({
      url: fileUrl,
      type: req.file.mimetype.startsWith('image/') ? 'image' : 'file'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

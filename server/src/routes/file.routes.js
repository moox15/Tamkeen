import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import mime from 'mime-types';
import db from '../config/database.js';
import config from '../config/index.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Ensure upload directory exists
if (!fs.existsSync(config.upload.dir)) {
  fs.mkdirSync(config.upload.dir, { recursive: true });
}

// Configure multer with security checks
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.upload.dir);
  },
  filename: (req, file, cb) => {
    // Generate random safe filename
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = `${uuidv4()}${ext}`;
    cb(null, safeName);
  },
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mimeType = file.mimetype;
  
  if (!config.upload.allowedExtensions.includes(ext)) {
    return cb(new Error('نوع الملف غير مسموح.'), false);
  }
  
  if (!config.upload.allowedTypes.includes(mimeType)) {
    return cb(new Error('نوع MIME غير مسموح.'), false);
  }
  
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: config.upload.maxSize },
});

// Upload file (admin only)
router.post('/upload', requireAdmin, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'لم يتم تحميل أي ملف.' });
  }
  
  res.json({
    message: 'تم رفع الملف بنجاح.',
    file: {
      id: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimeType: req.file.mimetype,
    },
  });
});

// Download file (access-controlled)
router.get('/:filename', requireAuth, (req, res) => {
  const filename = path.basename(req.params.filename); // Prevent path traversal
  const filePath = path.join(config.upload.dir, filename);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'الملف غير موجود.' });
  }
  
  // Set appropriate content type
  const mimeType = mime.lookup(filePath) || 'application/octet-stream';
  res.setHeader('Content-Type', mimeType);
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
  
  const stream = fs.createReadStream(filePath);
  stream.pipe(res);
});

export default router;

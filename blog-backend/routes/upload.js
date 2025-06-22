// blog-backend/routes/upload.js
const express = require('express');
const multer = require('multer');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// For Vercel - use memory storage instead of disk storage
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|webm|ogg|pdf|doc|docx/;
    const extname = allowedTypes.test(file.originalname.split('.').pop().toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: images, videos, PDFs, documents'));
    }
  }
});

// Upload endpoint - modified for Vercel serverless
router.post('/', authenticateToken, upload.array('files', 5), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    // For now, return mock URLs since we can't save to disk on Vercel
    // In production, you would upload to cloud storage (Cloudinary, AWS S3, etc.)
    const files = req.files.map((file, index) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const filename = file.fieldname + '-' + uniqueSuffix + '.' + file.originalname.split('.').pop();
      
      return {
        originalName: file.originalname,
        filename: filename,
        size: file.size,
        mimetype: file.mimetype,
        url: `https://via.placeholder.com/400x300/cccccc/666666?text=${encodeURIComponent(file.originalname)}`, // Placeholder URL
        buffer: file.buffer // File data in memory (for future cloud upload)
      };
    });

    const urls = files.map(file => file.url);
    
    res.json({
      message: 'Files received successfully (cloud storage integration needed)',
      urls: urls,
      files: files.map(file => ({
        originalName: file.originalName,
        filename: file.filename,
        size: file.size,
        mimetype: file.mimetype,
        url: file.url
      })),
      note: 'File upload temporarily uses placeholder URLs. Implement cloud storage for production.'
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Upload failed', error: error.message });
  }
});

// Health check for upload route
router.get('/status', (req, res) => {
  res.json({
    message: 'Upload service is running',
    storage: 'Memory (Vercel compatible)',
    maxFileSize: '10MB',
    allowedTypes: ['images', 'videos', 'PDFs', 'documents'],
    note: 'Cloud storage integration needed for production'
  });
});

module.exports = router;

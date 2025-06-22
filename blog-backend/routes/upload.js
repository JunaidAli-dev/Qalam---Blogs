const express = require('express');
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Cloudinary storage configuration
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'qalam-blog-uploads',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'webm', 'ogg', 'pdf', 'doc', 'docx'],
    resource_type: 'auto', // Automatically detect file type
    transformation: [
      { width: 1200, height: 800, crop: 'limit', quality: 'auto:good' }
    ]
  },
});

// Fallback to memory storage if Cloudinary is not configured
const memoryStorage = multer.memoryStorage();

const upload = multer({
  storage: process.env.CLOUDINARY_CLOUD_NAME ? storage : memoryStorage,
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

// Upload endpoint with Cloudinary integration
router.post('/', authenticateToken, upload.array('files', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'No files uploaded' 
      });
    }

    let files = [];

    if (process.env.CLOUDINARY_CLOUD_NAME) {
      // Cloudinary upload - files are already uploaded by multer-storage-cloudinary
      files = req.files.map((file) => ({
        originalName: file.originalname,
        filename: file.filename,
        size: file.size,
        mimetype: file.mimetype,
        url: file.path, // Cloudinary URL
        publicId: file.filename,
        cloudinary: true
      }));
    } else {
      // Fallback: Upload to Cloudinary manually using buffer
      console.log('Using manual Cloudinary upload...');
      
      const uploadPromises = req.files.map(async (file) => {
        return new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: 'qalam-blog-uploads',
              resource_type: 'auto',
              transformation: [
                { width: 1200, height: 800, crop: 'limit', quality: 'auto:good' }
              ]
            },
            (error, result) => {
              if (error) {
                console.error('Cloudinary upload error:', error);
                reject(error);
              } else {
                resolve({
                  originalName: file.originalname,
                  filename: result.public_id,
                  size: file.size,
                  mimetype: file.mimetype,
                  url: result.secure_url,
                  publicId: result.public_id,
                  cloudinary: true
                });
              }
            }
          );
          uploadStream.end(file.buffer);
        });
      });

      files = await Promise.all(uploadPromises);
    }

    const urls = files.map(file => file.url);
    
    res.json({
      success: true,
      message: 'Files uploaded successfully',
      urls: urls,
      files: files.map(file => ({
        originalName: file.originalName,
        filename: file.filename,
        size: file.size,
        mimetype: file.mimetype,
        url: file.url,
        publicId: file.publicId
      }))
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Upload failed', 
      error: error.message 
    });
  }
});

// Delete uploaded file
router.delete('/:publicId', authenticateToken, async (req, res) => {
  try {
    const { publicId } = req.params;
    
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      return res.status(400).json({
        success: false,
        message: 'Cloudinary not configured'
      });
    }

    const result = await cloudinary.uploader.destroy(publicId);
    
    res.json({
      success: true,
      message: 'File deleted successfully',
      result
    });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Delete failed',
      error: error.message
    });
  }
});

// Health check for upload route
router.get('/status', (req, res) => {
  const isCloudinaryConfigured = !!(
    process.env.CLOUDINARY_CLOUD_NAME && 
    process.env.CLOUDINARY_API_KEY && 
    process.env.CLOUDINARY_API_SECRET
  );

  res.json({
    success: true,
    message: 'Upload service is running',
    storage: isCloudinaryConfigured ? 'Cloudinary' : 'Memory (needs Cloudinary setup)',
    maxFileSize: '10MB',
    allowedTypes: ['images', 'videos', 'PDFs', 'documents'],
    cloudinaryConfigured: isCloudinaryConfigured,
    environment: process.env.NODE_ENV || 'development'
  });
});

module.exports = router;

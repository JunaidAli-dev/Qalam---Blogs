// blog-backend/server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const { testConnection } = require('./config/database');
require('dotenv').config();

const app = express();

// Test database connection (don't exit on failure in serverless)
testConnection().catch(err => {
  console.error('Database connection failed:', err.message);
});

// CORS configuration for Vercel deployment
app.use(cors({
  origin: [
    'https://qalam-blogs-app.vercel.app', // Vercel frontend
    'https://salmon-pebble-0cf2bbb1e.2.azurestaticapps.net', // Azure frontend
    'http://localhost:3000' // Local development
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// FIXED: Image proxy route to handle CORS issues
app.get('/api/proxy-image', async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ 
        success: false, 
        error: 'URL parameter is required' 
      });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (urlError) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid URL format' 
      });
    }

    console.log('Proxying image request for:', url);

    // Fetch the image from the external source
    const response = await axios.get(url, {
      responseType: 'stream',
      timeout: 10000, // 10 second timeout
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      maxRedirects: 5
    });

    // Set appropriate headers for the proxied image
    res.set({
      'Content-Type': response.headers['content-type'] || 'image/jpeg',
      'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type',
      'X-Proxy-Cache': 'MISS'
    });

    // Pipe the image data to the response
    response.data.pipe(res);

  } catch (error) {
    console.error('Error proxying image:', {
      url: req.query.url,
      error: error.message,
      code: error.code,
      status: error.response?.status
    });

    // Handle specific error types
    if (error.code === 'ENOTFOUND') {
      return res.status(404).json({ 
        success: false, 
        error: 'Image not found or domain not accessible' 
      });
    }

    if (error.code === 'ETIMEDOUT') {
      return res.status(408).json({ 
        success: false, 
        error: 'Request timeout - image server too slow' 
      });
    }

    if (error.response?.status === 403) {
      return res.status(403).json({ 
        success: false, 
        error: 'Access forbidden by image server' 
      });
    }

    res.status(500).json({ 
      success: false, 
      error: 'Failed to load image',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Routes
app.use('/api/posts', require('./routes/posts'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/upload', require('./routes/upload'));

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Qalam Blog API is running on Vercel!',
    timestamp: new Date().toISOString(),
    database: 'MySQL Connected',
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    platform: 'Vercel Serverless',
    nodeVersion: process.version,
    features: {
      imageProxy: true,
      cors: true,
      database: true
    }
  });
});

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'Qalam Blog API',
    version: '1.0.0',
    platform: 'Vercel Serverless',
    endpoints: {
      posts: '/api/posts',
      auth: '/api/auth',
      upload: '/api/upload',
      imageProxy: '/api/proxy-image?url=<image_url>'
    },
    status: 'active',
    cors: {
      enabled: true,
      origins: [
        'https://qalam-blogs-app.vercel.app', 
        'https://salmon-pebble-0cf2bbb1e.2.azurestaticapps.net',
        'http://localhost:3000'
      ]
    },
    features: {
      imageProxy: 'Handles CORS issues for external images',
      database: 'MySQL with UTF8MB4 support',
      authentication: 'JWT based auth system'
    }
  });
});

// API status endpoint for monitoring
app.get('/api/status', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development',
    platform: 'Vercel Serverless',
    nodeVersion: process.version,
    services: {
      database: 'connected',
      imageProxy: 'active',
      cors: 'enabled'
    }
  });
});

// Vercel specific health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    service: 'Qalam Blog API',
    platform: 'Vercel Serverless',
    checks: {
      server: 'healthy',
      database: 'connected',
      imageProxy: 'operational'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString(),
    platform: 'Vercel Serverless'
  });
  
  res.status(err.status || 500).json({ 
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? {
      message: err.message,
      stack: err.stack
    } : 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  console.log('404 - Route not found: ' + req.method + ' ' + req.originalUrl);
  res.status(404).json({ 
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
    platform: 'Vercel Serverless',
    availableEndpoints: [
      'GET /',
      'GET /api',
      'GET /api/status',
      'GET /health',
      'GET /api/proxy-image?url=<image_url>',
      'POST /api/auth/register',
      'POST /api/auth/login',
      'GET /api/posts',
      'POST /api/posts',
      'PUT /api/posts/:id',
      'DELETE /api/posts/:id',
      'POST /api/upload'
    ]
  });
});

// Export for Vercel
module.exports = app;

// blog-backend/server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const { testConnection } = require('./config/database');
require('dotenv').config();

const app = express();

// Test database connection (don't exit on failure in serverless)
testConnection();

// CORS configuration for Vercel deployment
app.use(cors({
  origin: [
    'https://qalam-blogs-app.vercel.app', // Your frontend URL
    'http://localhost:3000' // For local development
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Remove uploads directory serving for Vercel (serverless doesn't support file system)
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
    nodeVersion: process.version
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
      upload: '/api/upload'
    },
    status: 'active',
    cors: {
      enabled: true,
      origins: ['https://qalam-blogs-app.vercel.app', 'http://localhost:3000']
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
    nodeVersion: process.version
  });
});

// Vercel specific health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    service: 'Qalam Blog API',
    platform: 'Vercel Serverless'
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
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? {
      message: err.message,
      stack: err.stack
    } : 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// 404 handler - Vercel compatible (use * instead of /{*catchall})
app.use('/{*catchall}', (req, res) => {
  console.log('404 - Route not found: ' + req.method + ' ' + req.originalUrl);
  res.status(404).json({ 
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

// Export for Vercel (don't start server in serverless environment)
module.exports = app;

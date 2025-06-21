// blog-backend/server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const { testConnection } = require('./config/database');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// Test database connection
testConnection();

// CORS configuration for Azure deployment
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [
        'https://qalam-frontend.azurestaticapps.net', // Your Azure Static Web App URL
        'https://qalam-blogs-app.vercel.app', // Your Vercel frontend URL
        process.env.FRONTEND_URL // Additional frontend URL from env
      ] 
    : [
        'http://localhost:3000', // Local development
        'http://localhost:8080'  // Local testing
      ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/posts', require('./routes/posts'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/upload', require('./routes/upload'));

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Qalam Blog API is running on Azure App Service!',
    timestamp: new Date().toISOString(),
    database: 'MySQL Connected',
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    platform: 'Azure App Service',
    port: PORT,
    nodeVersion: process.version
  });
});

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'Qalam Blog API',
    version: '1.0.0',
    platform: 'Azure App Service',
    endpoints: {
      posts: '/api/posts',
      auth: '/api/auth',
      upload: '/api/upload'
    },
    status: 'active',
    cors: {
      enabled: true,
      origins: process.env.NODE_ENV === 'production' 
        ? ['https://qalam-blogs-app.vercel.app/', 'https://qalam-blogs-app.vercel.app']
        : ['http://localhost:3000']
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
    platform: 'Azure App Service',
    nodeVersion: process.version
  });
});

// Azure App Service specific health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    service: 'Qalam Blog API',
    platform: 'Azure App Service'
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
    platform: 'Azure App Service'
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

// 404 handler - Azure compatible
app.use('/{*catchall}', (req, res) => {
  console.log('404 - Route not found: ' + req.method + ' ' + req.originalUrl);
  res.status(404).json({ 
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
    platform: 'Azure App Service',
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

// Graceful shutdown handling for Azure
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully on Azure');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully on Azure');
  process.exit(0);
});

// Start server - Azure App Service compatible
app.listen(PORT, () => {
  console.log('Qalam API running on Azure App Service');
  console.log('Port: ' + PORT);
  console.log('Environment: ' + (process.env.NODE_ENV || 'development'));
  console.log('Node Version: ' + process.version);
  console.log('Platform: Azure App Service');
  console.log('Health check: /health');
  console.log('API info: /api');
  console.log('CORS enabled for production and development URLs');
});

// Export for Azure App Service
module.exports = app;

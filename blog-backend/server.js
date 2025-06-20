// blog-backend/server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const { testConnection } = require('./config/database');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Test database connection
testConnection();

// CORS configuration for production and development
// In blog-backend/server.js
app.use(cors({
  origin: [
    'https://qalam-blogs-app.vercel.app', // Your actual frontend URL
    'http://localhost:3000' // For local development
  ],
  credentials: true
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
    message: 'Qalam Blog API is running!',
    timestamp: new Date().toISOString(),
    database: 'MySQL Connected',
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'Qalam Blog API',
    version: '1.0.0',
    endpoints: {
      posts: '/api/posts',
      auth: '/api/auth',
      upload: '/api/upload'
    },
    status: 'active'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler - FIXED VERSION
app.use('/{*catchall}', (req, res) => {
  res.status(404).json({ 
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Start server
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 API URL: http://localhost:${PORT}`);
    console.log(`🏥 Health check: http://localhost:${PORT}/`);
    console.log(`📁 Uploads directory: ${path.join(__dirname, 'uploads')}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

// Export for Vercel
module.exports = app;

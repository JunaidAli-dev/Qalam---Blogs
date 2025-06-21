const mysql = require('mysql2/promise');
require('dotenv').config();

let pool;

const createPool = () => {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'blog_db',
      ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
      } : false,
      waitForConnections: true,
      connectionLimit: 5, // Lower for serverless
      queueLimit: 0,
      charset: 'utf8mb4'
      // Removed: acquireTimeout and timeout (invalid options for MySQL2)
    });
  }
  return pool;
};

const testConnection = async () => {
  try {
    const pool = createPool();
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully');
    console.log(`📊 Database: ${process.env.DB_NAME || 'blog_db'}`);
    console.log(`🌍 Host: ${process.env.DB_HOST || 'localhost'}`);
    console.log(`👤 User: ${process.env.DB_USER || 'root'}`);
    connection.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('🔍 Check your database credentials and connection settings');
    // Don't exit process in serverless environment
  }
};

module.exports = { pool: createPool(), testConnection };

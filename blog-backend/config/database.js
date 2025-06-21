const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: false
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000,
  charset: 'utf8mb4'
});

const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully to AWS RDS');
    console.log(`📊 Database: ${process.env.DB_NAME}`);
    console.log(`🌍 Host: ${process.env.DB_HOST}`);
    console.log(`👤 User: ${process.env.DB_USER}`);
    connection.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('🔍 Check your RDS endpoint, credentials, and security group settings');
    process.exit(1);
  }
};

module.exports = { pool, testConnection };

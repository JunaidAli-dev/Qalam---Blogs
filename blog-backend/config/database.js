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
      port: process.env.DB_PORT || 3306,
      ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false,
        ca: undefined // Let Azure handle SSL certificate
      } : false,
      waitForConnections: true,
      connectionLimit: 3, // Very low for serverless
      queueLimit: 0,
      acquireTimeout: 60000, // 60 seconds
      timeout: 60000, // 60 seconds
      reconnect: true,
      charset: 'utf8mb4',
      // Azure MySQL specific settings
      connectTimeout: 60000,
      socketPath: undefined,
      // Handle connection drops
      idleTimeout: 300000,
      maxIdle: 3
    });

    // Handle pool errors
    pool.on('connection', function (connection) {
      console.log('Connected as id ' + connection.threadId);
    });

    pool.on('error', function(err) {
      console.error('Database pool error:', err);
      if(err.code === 'PROTOCOL_CONNECTION_LOST') {
        console.log('Recreating pool...');
        pool = null;
        return createPool();
      } else {
        throw err;
      }
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
    console.log(`🔌 Port: ${process.env.DB_PORT || 3306}`);
    console.log(`🔒 SSL: ${process.env.NODE_ENV === 'production' ? 'Enabled' : 'Disabled'}`);
    
    // Test a simple query
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('✅ Test query successful:', rows[0]);
    
    connection.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('🔍 Error code:', error.code);
    console.error('🔍 Error errno:', error.errno);
    console.error('🔍 Check your database credentials and connection settings');
    
    // Log environment variables for debugging (without password)
    console.log('🔧 Environment check:');
    console.log('- DB_HOST:', process.env.DB_HOST ? 'Set' : 'Not set');
    console.log('- DB_USER:', process.env.DB_USER ? 'Set' : 'Not set');
    console.log('- DB_PASSWORD:', process.env.DB_PASSWORD ? 'Set' : 'Not set');
    console.log('- DB_NAME:', process.env.DB_NAME ? 'Set' : 'Not set');
    console.log('- NODE_ENV:', process.env.NODE_ENV);
  }
};

module.exports = { pool: createPool(), testConnection };

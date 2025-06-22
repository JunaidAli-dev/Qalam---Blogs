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
      
      // SSL Configuration for Azure MySQL
      ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
      } : false,
      
      // Valid MySQL2 connection pool options only
      waitForConnections: true,
      connectionLimit: 3, // Low for serverless (Vercel)
      queueLimit: 0,
      acquireTimeout: 60000, // 60 seconds
      timeout: 60000, // 60 seconds
      charset: 'utf8mb4',
      
      // Valid MySQL2 connection options
      connectTimeout: 60000, // 60 seconds
      
      // Valid additional options
      supportBigNumbers: true,
      bigNumberStrings: true,
      dateStrings: false,
      debug: false,
      multipleStatements: false,
      typeCast: true
    });

    // Handle pool connection events
    pool.on('connection', function (connection) {
      console.log('✅ Connected as id ' + connection.threadId);
    });

    // Handle pool errors with proper error handling
    pool.on('error', function(err) {
      console.error('❌ Database pool error:', err.code, err.message);
      
      // Handle specific error types
      if (err.code === 'PROTOCOL_CONNECTION_LOST' || 
          err.code === 'ECONNRESET' || 
          err.code === 'ETIMEDOUT') {
        console.log('🔄 Connection lost, pool will recreate on next request');
        pool = null;
      } else {
        console.error('💥 Unhandled database error:', err);
      }
    });

    // Handle pool acquire/release events for debugging
    pool.on('acquire', function (connection) {
      console.log('🔗 Connection %d acquired', connection.threadId);
    });

    pool.on('release', function (connection) {
      console.log('🔓 Connection %d released', connection.threadId);
    });
  }
  return pool;
};

const testConnection = async () => {
  let connection;
  try {
    const pool = createPool();
    console.log('🔄 Testing database connection...');
    
    // Get connection with proper error handling
    connection = await pool.getConnection();
    console.log('✅ Database connected successfully');
    
    // Log connection details
    console.log('📊 Connection Details:');
    console.log(`   Database: ${process.env.DB_NAME || 'blog_db'}`);
    console.log(`   Host: ${process.env.DB_HOST || 'localhost'}`);
    console.log(`   Port: ${process.env.DB_PORT || 3306}`);
    console.log(`   User: ${process.env.DB_USER || 'root'}`);
    console.log(`   SSL: ${process.env.NODE_ENV === 'production' ? 'Enabled' : 'Disabled'}`);
    console.log(`   Thread ID: ${connection.threadId}`);
    
    // Test a simple query
    console.log('🔍 Testing simple query...');
    const [rows] = await connection.execute('SELECT 1 as test, NOW() as current_time');
    console.log('✅ Test query successful:', rows[0]);
    
    // Test database existence
    const [dbRows] = await connection.execute('SELECT DATABASE() as current_db');
    console.log('✅ Current database:', dbRows[0].current_db);
    
  } catch (error) {
    console.error('❌ Database connection test failed:');
    console.error('   Error:', error.message);
    console.error('   Code:', error.code);
    console.error('   Errno:', error.errno);
    
    // Specific error analysis
    if (error.code === 'ETIMEDOUT') {
      console.error('🔍 ETIMEDOUT Analysis:');
      console.error('   - Check Azure MySQL firewall rules');
      console.error('   - Add firewall rule: 0.0.0.0 to 255.255.255.255');
      console.error('   - Verify server is running and accessible');
    } else if (error.code === 'ENOTFOUND') {
      console.error('🔍 ENOTFOUND Analysis:');
      console.error('   - Check DB_HOST environment variable');
      console.error('   - Verify server hostname is correct');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('🔍 ACCESS DENIED Analysis:');
      console.error('   - Check DB_USER and DB_PASSWORD');
      console.error('   - Verify user permissions');
    }
    
    // Environment variables check (without exposing password)
    console.error('🔧 Environment Variables:');
    console.error(`   DB_HOST: ${process.env.DB_HOST ? 'Set ✅' : 'Not set ❌'}`);
    console.error(`   DB_USER: ${process.env.DB_USER ? 'Set ✅' : 'Not set ❌'}`);
    console.error(`   DB_PASSWORD: ${process.env.DB_PASSWORD ? 'Set ✅' : 'Not set ❌'}`);
    console.error(`   DB_NAME: ${process.env.DB_NAME ? 'Set ✅' : 'Not set ❌'}`);
    console.error(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
    
  } finally {
    if (connection) {
      connection.release();
      console.log('🔓 Test connection released');
    }
  }
};

// Graceful shutdown
const closePool = async () => {
  if (pool) {
    try {
      await pool.end();
      console.log('✅ Database pool closed gracefully');
      pool = null;
    } catch (error) {
      console.error('❌ Error closing pool:', error.message);
    }
  }
};

// Handle process termination
process.on('SIGINT', closePool);
process.on('SIGTERM', closePool);

module.exports = { 
  pool: createPool(), 
  testConnection,
  closePool
};

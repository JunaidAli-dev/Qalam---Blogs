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
      
      // FIXED: Proper SSL Configuration
      ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false,
        ca: undefined
      } : false,
      
      // FIXED: Optimized pool settings for Vercel serverless
      waitForConnections: true,
      connectionLimit: 5, // Increased slightly for better performance
      queueLimit: 0,
      acquireTimeout: 30000, // Reduced to 30 seconds for faster timeout
      timeout: 30000,
      
      // FIXED: Character set configuration to prevent collation errors
      charset: 'utf8mb4',
      collation: 'utf8mb4_general_ci',
      
      // FIXED: Connection timeout settings
      connectTimeout: 30000,
      
      // FIXED: Additional MySQL2 options
      supportBigNumbers: true,
      bigNumberStrings: true,
      dateStrings: false,
      debug: false,
      multipleStatements: false,
      typeCast: true,
      
      // FIXED: Keep alive settings for better connection stability
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
      
      // FIXED: Idle connection management
      maxIdle: 5,
      idleTimeout: 60000
    });

    // FIXED: Enhanced connection event handling
    pool.on('connection', function (connection) {
      console.log('✅ Connected as id ' + connection.threadId);
      
      // Set connection charset to prevent collation issues
      connection.query("SET NAMES utf8mb4 COLLATE utf8mb4_general_ci");
    });

    // FIXED: Better error handling with reconnection logic
    pool.on('error', function(err) {
      console.error('❌ Database pool error:', err.code, err.message);
      
      // Handle specific error types that require pool recreation
      if (err.code === 'PROTOCOL_CONNECTION_LOST' || 
          err.code === 'ECONNRESET' || 
          err.code === 'ETIMEDOUT' ||
          err.code === 'ENOTFOUND' ||
          err.fatal === true) {
        console.log('🔄 Fatal error detected, recreating pool on next request');
        pool = null;
      }
    });

    // FIXED: Connection lifecycle logging
    pool.on('acquire', function (connection) {
      console.log('🔗 Connection %d acquired', connection.threadId);
    });

    pool.on('release', function (connection) {
      console.log('🔓 Connection %d released', connection.threadId);
    });
  }
  return pool;
};

// FIXED: Enhanced connection test with better error handling
const testConnection = async () => {
  let connection;
  try {
    const currentPool = createPool();
    console.log('🔄 Testing database connection...');
    
    // FIXED: Get connection with timeout
    connection = await Promise.race([
      currentPool.getConnection(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 15000)
      )
    ]);
    
    console.log('✅ Database connected successfully');
    
    // FIXED: Set proper charset on connection
    await connection.execute("SET NAMES utf8mb4 COLLATE utf8mb4_general_ci");
    
    // Log connection details
    console.log('📊 Connection Details:');
    console.log(`   Database: ${process.env.DB_NAME || 'blog_db'}`);
    console.log(`   Host: ${process.env.DB_HOST || 'localhost'}`);
    console.log(`   Port: ${process.env.DB_PORT || 3306}`);
    console.log(`   User: ${process.env.DB_USER || 'root'}`);
    console.log(`   SSL: ${process.env.NODE_ENV === 'production' ? 'Enabled' : 'Disabled'}`);
    console.log(`   Thread ID: ${connection.threadId}`);
    
    // FIXED: Test charset and collation
    console.log('🔍 Testing charset and collation...');
    const [charsetRows] = await connection.execute(`
      SELECT 
        @@character_set_connection as charset,
        @@collation_connection as collation,
        @@character_set_database as db_charset,
        @@collation_database as db_collation
    `);
    console.log('✅ Charset info:', charsetRows[0]);
    
    // Test a simple query
    console.log('🔍 Testing simple query...');
    const [rows] = await connection.execute('SELECT 1 as test, NOW() as current_time');
    console.log('✅ Test query successful:', rows[0]);
    
    // Test database existence
    const [dbRows] = await connection.execute('SELECT DATABASE() as current_db');
    console.log('✅ Current database:', dbRows[0].current_db);
    
    // FIXED: Test table existence and collation
    try {
      const [tableRows] = await connection.execute(`
        SELECT TABLE_NAME, TABLE_COLLATION 
        FROM information_schema.TABLES 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'posts'
      `, [process.env.DB_NAME || 'blog_db']);
      
      if (tableRows.length > 0) {
        console.log('✅ Posts table found with collation:', tableRows[0].TABLE_COLLATION);
      } else {
        console.log('⚠️  Posts table not found');
      }
    } catch (tableError) {
      console.log('⚠️  Could not check table info:', tableError.message);
    }
    
  } catch (error) {
    console.error('❌ Database connection test failed:');
    console.error('   Error:', error.message);
    console.error('   Code:', error.code);
    console.error('   Errno:', error.errno);
    
    // FIXED: Enhanced error analysis
    if (error.code === 'ETIMEDOUT') {
      console.error('🔍 ETIMEDOUT Analysis:');
      console.error('   - Check Azure MySQL firewall rules');
      console.error('   - Add firewall rule: 0.0.0.0 to 255.255.255.255');
      console.error('   - Verify server is running and accessible');
      console.error('   - Check if connection limit is reached');
    } else if (error.code === 'ENOTFOUND') {
      console.error('🔍 ENOTFOUND Analysis:');
      console.error('   - Check DB_HOST environment variable');
      console.error('   - Verify server hostname is correct');
      console.error('   - Check DNS resolution');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('🔍 ACCESS DENIED Analysis:');
      console.error('   - Check DB_USER and DB_PASSWORD');
      console.error('   - Verify user permissions');
      console.error('   - Check if user can connect from current IP');
    } else if (error.code === 'ER_IMPOSSIBLE_STRING_CONVERSION') {
      console.error('🔍 CHARSET CONVERSION Error:');
      console.error('   - Database charset/collation mismatch detected');
      console.error('   - Run: ALTER DATABASE your_db CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci');
      console.error('   - Run: ALTER TABLE posts CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci');
    }
    
    // Environment variables check (without exposing password)
    console.error('🔧 Environment Variables:');
    console.error(`   DB_HOST: ${process.env.DB_HOST ? 'Set ✅' : 'Not set ❌'}`);
    console.error(`   DB_USER: ${process.env.DB_USER ? 'Set ✅' : 'Not set ❌'}`);
    console.error(`   DB_PASSWORD: ${process.env.DB_PASSWORD ? 'Set ✅' : 'Not set ❌'}`);
    console.error(`   DB_NAME: ${process.env.DB_NAME ? 'Set ✅' : 'Not set ❌'}`);
    console.error(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
    
    throw error; // Re-throw for proper error handling
    
  } finally {
    if (connection) {
      connection.release();
      console.log('🔓 Test connection released');
    }
  }
};

// FIXED: Enhanced graceful shutdown
const closePool = async () => {
  if (pool) {
    try {
      console.log('🔄 Closing database pool...');
      await pool.end();
      console.log('✅ Database pool closed gracefully');
      pool = null;
    } catch (error) {
      console.error('❌ Error closing pool:', error.message);
      pool = null; // Force reset even on error
    }
  }
};

// FIXED: Helper function to execute queries with proper error handling
const executeQuery = async (sql, params = []) => {
  let connection;
  try {
    const currentPool = createPool();
    connection = await currentPool.getConnection();
    
    // Set proper charset for this connection
    await connection.execute("SET NAMES utf8mb4 COLLATE utf8mb4_general_ci");
    
    const [rows, fields] = await connection.execute(sql, params);
    return [rows, fields];
  } catch (error) {
    console.error('❌ Query execution error:', error.message);
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

// FIXED: Helper function to get pool instance
const getPool = () => {
  return createPool();
};

// Handle process termination
process.on('SIGINT', closePool);
process.on('SIGTERM', closePool);
process.on('SIGUSR2', closePool); // For nodemon

// FIXED: Export all necessary functions
module.exports = { 
  pool: createPool(), 
  getPool,
  testConnection,
  closePool,
  executeQuery
};

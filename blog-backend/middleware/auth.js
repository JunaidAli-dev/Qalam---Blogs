const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        message: 'Access token required',
        error: 'MISSING_TOKEN'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get fresh user data from database
    const [users] = await pool.execute(
      'SELECT id, username, email FROM users WHERE id = ?',
      [decoded.userId || decoded.id]
    );

    if (users.length === 0) {
      return res.status(401).json({ 
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      });
    }

    req.user = users[0];
    next();
  } catch (err) {
    console.error('JWT verification error:', err);
    return res.status(403).json({ 
      message: 'Invalid or expired token',
      error: 'INVALID_TOKEN'
    });
  }
};

// Middleware to check if user owns the post
const authorizePostOwner = async (req, res, next) => {
  try {
    const postId = parseInt(req.params.id);
    const userId = req.user.id;

    const [posts] = await pool.execute(
      'SELECT user_id FROM posts WHERE id = ?',
      [postId]
    );

    if (posts.length === 0) {
      return res.status(404).json({
        message: 'Post not found',
        error: 'POST_NOT_FOUND'
      });
    }

    if (posts[0].user_id !== userId) {
      return res.status(403).json({
        message: 'Forbidden: You can only manage your own posts',
        error: 'NOT_POST_OWNER'
      });
    }

    next();
  } catch (error) {
    console.error('Authorization error:', error);
    return res.status(500).json({
      message: 'Authorization error',
      error: 'AUTH_ERROR'
    });
  }
};

module.exports = { authenticateToken, authorizePostOwner };

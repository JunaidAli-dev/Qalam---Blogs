// blog-backend/models/PostLike.js
const { pool } = require('../config/database');

class PostLike {
  static async addLike(postId, userId) {
    try {
      const [result] = await pool.execute(
        'INSERT IGNORE INTO post_likes (post_id, user_id) VALUES (?, ?)',
        [parseInt(postId), parseInt(userId)]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  static async removeLike(postId, userId) {
    try {
      const [result] = await pool.execute(
        'DELETE FROM post_likes WHERE post_id = ? AND user_id = ?',
        [parseInt(postId), parseInt(userId)]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  static async hasUserLiked(postId, userId) {
    try {
      const [rows] = await pool.execute(
        'SELECT id FROM post_likes WHERE post_id = ? AND user_id = ?',
        [parseInt(postId), parseInt(userId)]
      );
      return rows.length > 0;
    } catch (error) {
      throw error;
    }
  }

  static async getLikesCount(postId) {
    try {
      const [rows] = await pool.execute(
        'SELECT COUNT(*) as count FROM post_likes WHERE post_id = ?',
        [parseInt(postId)]
      );
      return rows[0].count;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = PostLike;

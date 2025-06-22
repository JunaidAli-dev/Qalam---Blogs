const { pool } = require('../config/database');

class PostLike {
  // Validate input parameters
  static _validateParams(postId, userId = null) {
    const parsedPostId = parseInt(postId);
    if (!Number.isInteger(parsedPostId) || parsedPostId <= 0) {
      throw new Error('Invalid postId: must be a positive integer');
    }
    
    if (userId !== null) {
      const parsedUserId = parseInt(userId);
      if (!Number.isInteger(parsedUserId) || parsedUserId <= 0) {
        throw new Error('Invalid userId: must be a positive integer');
      }
      return { postId: parsedPostId, userId: parsedUserId };
    }
    
    return { postId: parsedPostId };
  }

  // Add a like if not already liked (Instagram-style)
  static async addLike(postId, userId) {
    const { postId: validPostId, userId: validUserId } = this._validateParams(postId, userId);
    
    try {
      const [result] = await pool.execute(
        'INSERT IGNORE INTO post_likes (post_id, user_id) VALUES (?, ?)',
        [validPostId, validUserId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error adding like:', error);
      throw error;
    }
  }

  // Remove a like
  static async removeLike(postId, userId) {
    const { postId: validPostId, userId: validUserId } = this._validateParams(postId, userId);
    
    try {
      const [result] = await pool.execute(
        'DELETE FROM post_likes WHERE post_id = ? AND user_id = ?',
        [validPostId, validUserId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error removing like:', error);
      throw error;
    }
  }

  // Check if user has liked the post
  static async hasUserLiked(postId, userId) {
    const { postId: validPostId, userId: validUserId } = this._validateParams(postId, userId);
    
    try {
      const [rows] = await pool.execute(
        'SELECT id FROM post_likes WHERE post_id = ? AND user_id = ?',
        [validPostId, validUserId]
      );
      return rows.length > 0;
    } catch (error) {
      console.error('Error checking like status:', error);
      throw error;
    }
  }

  // Get total likes count for a post
  static async getLikesCount(postId) {
    const { postId: validPostId } = this._validateParams(postId);
    
    try {
      const [rows] = await pool.execute(
        'SELECT COUNT(*) as count FROM post_likes WHERE post_id = ?',
        [validPostId]
      );
      return parseInt(rows[0].count) || 0;
    } catch (error) {
      console.error('Error getting likes count:', error);
      throw error;
    }
  }

  // Toggle like status (Instagram-style like/unlike)
  static async toggleLike(postId, userId) {
    const { postId: validPostId, userId: validUserId } = this._validateParams(postId, userId);
    
    try {
      const hasLiked = await this.hasUserLiked(validPostId, validUserId);
      
      if (hasLiked) {
        // Unlike the post
        await this.removeLike(validPostId, validUserId);
        const likesCount = await this.getLikesCount(validPostId);
        return { 
          action: 'unliked', 
          liked: false, 
          likesCount 
        };
      } else {
        // Like the post
        await this.addLike(validPostId, validUserId);
        const likesCount = await this.getLikesCount(validPostId);
        return { 
          action: 'liked', 
          liked: true, 
          likesCount 
        };
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      throw error;
    }
  }

  // Get users who liked a post (for admin analytics)
  static async getUsersWhoLiked(postId, limit = 10, offset = 0) {
    const { postId: validPostId } = this._validateParams(postId);
    
    try {
      const [rows] = await pool.execute(`
        SELECT 
          u.id, 
          u.username, 
          pl.created_at as liked_at
        FROM post_likes pl 
        JOIN users u ON pl.user_id = u.id 
        WHERE pl.post_id = ? 
        ORDER BY pl.created_at DESC 
        LIMIT ? OFFSET ?
      `, [validPostId, parseInt(limit), parseInt(offset)]);
      return rows;
    } catch (error) {
      console.error('Error getting users who liked:', error);
      throw error;
    }
  }

  // Get like analytics for a post (Instagram-style analytics)
  static async getLikeAnalytics(postId) {
    const { postId: validPostId } = this._validateParams(postId);
    
    try {
      const [rows] = await pool.execute(`
        SELECT 
          COUNT(*) as totalLikes,
          COUNT(DISTINCT user_id) as uniqueUsers,
          DATE(created_at) as likeDate,
          COUNT(*) as dailyLikes
        FROM post_likes 
        WHERE post_id = ? 
        GROUP BY DATE(created_at)
        ORDER BY likeDate DESC
        LIMIT 30
      `, [validPostId]);
      
      const [totalRows] = await pool.execute(
        'SELECT COUNT(*) as total FROM post_likes WHERE post_id = ?',
        [validPostId]
      );
      
      return {
        totalLikes: parseInt(totalRows[0].total) || 0,
        dailyBreakdown: rows
      };
    } catch (error) {
      console.error('Error getting like analytics:', error);
      throw error;
    }
  }

  // Check if post exists before performing like operations
  static async validatePost(postId) {
    const { postId: validPostId } = this._validateParams(postId);
    
    try {
      const [rows] = await pool.execute(
        'SELECT id FROM posts WHERE id = ? AND status = ?',
        [validPostId, 'published']
      );
      return rows.length > 0;
    } catch (error) {
      console.error('Error validating post:', error);
      throw error;
    }
  }
}

module.exports = PostLike;

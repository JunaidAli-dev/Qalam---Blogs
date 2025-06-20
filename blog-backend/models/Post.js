// blog-backend/models/Post.js
const { pool } = require('../config/database');

class Post {
  static async findById(id) {
    try {
      const [rows] = await pool.execute(`
        SELECT p.*, u.username 
        FROM posts p 
        JOIN users u ON p.user_id = u.id 
        WHERE p.id = ?
      `, [parseInt(id)]);
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  static async getAll(limit = 20, offset = 0, status = 'published') {
    try {
      // Use query() instead of execute() for LIMIT/OFFSET to avoid MySQL 8.0.22+ bug
      const [rows] = await pool.query(`
        SELECT p.id, p.title, p.content, p.slug, p.views, p.shares, p.created_at, p.updated_at,
               u.username,
               (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.id) as likes_count
        FROM posts p 
        JOIN users u ON p.user_id = u.id 
        WHERE p.status = ?
        ORDER BY p.created_at DESC 
        LIMIT ? OFFSET ?
      `, [status, parseInt(limit), parseInt(offset)]);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  static async create(postData) {
    try {
      const { title, content, slug, user_id, status = 'published' } = postData;
      const [result] = await pool.execute(
        'INSERT INTO posts (title, content, slug, user_id, status) VALUES (?, ?, ?, ?, ?)',
        [title, content, slug, parseInt(user_id), status]
      );
      return result.insertId;
    } catch (error) {
      throw error;
    }
  }

  static async update(id, postData) {
    try {
      const fields = [];
      const values = [];
      
      Object.keys(postData).forEach(key => {
        if (postData[key] !== undefined && key !== 'id') {
          fields.push(`${key} = ?`);
          values.push(postData[key]);
        }
      });
      
      if (fields.length === 0) return false;
      
      values.push(parseInt(id));
      const [result] = await pool.execute(
        `UPDATE posts SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  static async delete(id) {
    try {
      const [result] = await pool.execute('DELETE FROM posts WHERE id = ?', [parseInt(id)]);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  static async incrementViews(id) {
    try {
      const [result] = await pool.execute(
        'UPDATE posts SET views = views + 1 WHERE id = ?',
        [parseInt(id)]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  static async incrementShares(id) {
    try {
      const [result] = await pool.execute(
        'UPDATE posts SET shares = shares + 1 WHERE id = ?',
        [parseInt(id)]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  static async getByUserId(userId, limit = 20, offset = 0) {
    try {
      // Use query() instead of execute() for LIMIT/OFFSET
      const [rows] = await pool.query(`
        SELECT p.*, u.username,
               (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.id) as likes_count
        FROM posts p 
        JOIN users u ON p.user_id = u.id 
        WHERE p.user_id = ?
        ORDER BY p.created_at DESC 
        LIMIT ? OFFSET ?
      `, [parseInt(userId), parseInt(limit), parseInt(offset)]);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  static async search(query, limit = 20, offset = 0) {
    try {
      // Use query() instead of execute() for LIMIT/OFFSET
      const [rows] = await pool.query(`
        SELECT p.*, u.username,
               (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.id) as likes_count
        FROM posts p 
        JOIN users u ON p.user_id = u.id 
        WHERE p.status = 'published' 
        AND (p.title LIKE ? OR p.content LIKE ?)
        ORDER BY p.created_at DESC 
        LIMIT ? OFFSET ?
      `, [`%${query}%`, `%${query}%`, parseInt(limit), parseInt(offset)]);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  static async generateSlug(title) {
    const baseSlug = title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    let slug = baseSlug;
    let counter = 1;
    
    while (true) {
      const [rows] = await pool.execute('SELECT id FROM posts WHERE slug = ?', [slug]);
      if (rows.length === 0) break;
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    
    return slug;
  }

 
static async incrementViews(id, userIdentifier) {
  try {
    // Check if this user has viewed this post recently (within 24 hours)
    const [existingView] = await pool.execute(
      'SELECT id FROM post_views WHERE post_id = ? AND user_identifier = ? AND created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)',
      [parseInt(id), userIdentifier]
    );

    // If no recent view found, increment the count
    if (existingView.length === 0) {
      // Insert new view record
      await pool.execute(
        'INSERT INTO post_views (post_id, user_identifier) VALUES (?, ?)',
        [parseInt(id), userIdentifier]
      );

      // Increment the views count
      const [result] = await pool.execute(
        'UPDATE posts SET views = views + 1 WHERE id = ?',
        [parseInt(id)]
      );
      return result.affectedRows > 0;
    }
    
    return false; // View not counted (recent view exists)
  } catch (error) {
    throw error;
  }
}

}

module.exports = Post;

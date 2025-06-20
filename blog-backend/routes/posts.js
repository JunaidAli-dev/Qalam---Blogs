// blog-backend/routes/posts.js
const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const Post = require('../models/Post');
const PostLike = require('../models/PostLike');
const router = express.Router();

// Helper to calculate read time
function calculateReadTime(content) {
  const wordsPerMinute = 200;
  const wordCount = content.trim().split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

// GET all posts - Public
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    console.log('Fetching posts with params:', { limit, offset, status: 'published' });
    
    const posts = await Post.getAll(limit, offset, 'published');
    
    const postsWithReadTime = posts.map(post => ({
      ...post,
      readTime: calculateReadTime(post.content)
    }));

    res.json(postsWithReadTime);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ message: 'Error fetching posts', error: error.message });
  }
});

// GET single post - Public
router.get('/:id', async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    if (isNaN(postId)) {
      return res.status(400).json({ message: 'Invalid post ID' });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Create unique identifier for this user (IP + User Agent)
    const userIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    const userIdentifier = `${userIP}-${Buffer.from(userAgent).toString('base64').substring(0, 50)}`;

    // Increment views with unique tracking
    await Post.incrementViews(postId, userIdentifier);

    // Get fresh post data with updated views
    const updatedPost = await Post.findById(postId);

    // Get likes count
    const likesCount = await PostLike.getLikesCount(postId);
    
    const postWithMeta = {
      ...updatedPost,
      likesCount,
      readTime: calculateReadTime(updatedPost.content)
    };

    res.json(postWithMeta);
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ message: 'Error fetching post', error: error.message });
  }
});

// Check if user liked post - Requires authentication
router.get('/:id/liked', authenticateToken, async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    if (isNaN(postId)) {
      return res.status(400).json({ message: 'Invalid post ID' });
    }

    const hasLiked = await PostLike.hasUserLiked(postId, req.user.id);
    const likesCount = await PostLike.getLikesCount(postId);

    res.json({ hasLiked, likesCount });
  } catch (error) {
    console.error('Error checking like status:', error);
    res.status(500).json({ message: 'Error checking like status', error: error.message });
  }
});

// Like post - Requires authentication
router.post('/:id/like', authenticateToken, async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    if (isNaN(postId)) {
      return res.status(400).json({ message: 'Invalid post ID' });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const hasLiked = await PostLike.hasUserLiked(postId, req.user.id);
    if (hasLiked) {
      return res.status(400).json({ message: 'You have already liked this post' });
    }

    await PostLike.addLike(postId, req.user.id);
    const likesCount = await PostLike.getLikesCount(postId);

    res.json({ 
      likesCount,
      message: 'Post liked successfully'
    });
  } catch (error) {
    console.error('Error liking post:', error);
    res.status(500).json({ message: 'Error liking post', error: error.message });
  }
});

// Unlike post - Requires authentication
router.delete('/:id/like', authenticateToken, async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    if (isNaN(postId)) {
      return res.status(400).json({ message: 'Invalid post ID' });
    }

    const hasLiked = await PostLike.hasUserLiked(postId, req.user.id);
    if (!hasLiked) {
      return res.status(400).json({ message: 'You have not liked this post' });
    }

    await PostLike.removeLike(postId, req.user.id);
    const likesCount = await PostLike.getLikesCount(postId);

    res.json({ 
      likesCount,
      message: 'Post unliked successfully'
    });
  } catch (error) {
    console.error('Error unliking post:', error);
    res.status(500).json({ message: 'Error unliking post', error: error.message });
  }
});

// Share post - Public
router.post('/:id/share', async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    if (isNaN(postId)) {
      return res.status(400).json({ message: 'Invalid post ID' });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    await Post.incrementShares(postId);
    const updatedPost = await Post.findById(postId);

    res.json({ 
      shares: updatedPost.shares,
      message: 'Post shared successfully'
    });
  } catch (error) {
    console.error('Error sharing post:', error);
    res.status(500).json({ message: 'Error sharing post', error: error.message });
  }
});

// CREATE post - Requires authentication
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, content } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    const slug = await Post.generateSlug(title);
    
    const postId = await Post.create({
      title: title.trim(),
      content: content.trim(),
      slug,
      user_id: req.user.id
    });

    const newPost = await Post.findById(postId);
    const postWithMeta = {
      ...newPost,
      likesCount: 0,
      readTime: calculateReadTime(newPost.content)
    };

    res.status(201).json(postWithMeta);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ message: 'Error creating post', error: error.message });
  }
});

// UPDATE post - Requires authentication and ownership
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    if (isNaN(postId)) {
      return res.status(400).json({ message: 'Invalid post ID' });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.user_id !== req.user.id) {
      return res.status(403).json({ message: 'You can only edit your own posts' });
    }

    const { title, content } = req.body;
    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    const updateData = {
      title: title.trim(),
      content: content.trim()
    };

    // Generate new slug if title changed
    if (title.trim() !== post.title) {
      updateData.slug = await Post.generateSlug(title);
    }

    await Post.update(postId, updateData);
    const updatedPost = await Post.findById(postId);
    const likesCount = await PostLike.getLikesCount(postId);

    const postWithMeta = {
      ...updatedPost,
      likesCount,
      readTime: calculateReadTime(updatedPost.content)
    };

    res.json(postWithMeta);
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ message: 'Error updating post', error: error.message });
  }
});

// DELETE post - Requires authentication and ownership
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    if (isNaN(postId)) {
      return res.status(400).json({ message: 'Invalid post ID' });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.user_id !== req.user.id) {
      return res.status(403).json({ message: 'You can only delete your own posts' });
    }

    await Post.delete(postId);
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ message: 'Error deleting post', error: error.message });
  }
});

module.exports = router;

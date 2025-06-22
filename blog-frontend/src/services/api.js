import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://qalam-blogs-backend.vercel.app';

// Configure axios defaults
axios.defaults.baseURL = API_BASE_URL;

// Add request interceptor to include auth token
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// FIXED: Get user's own posts with correct route
export const getUserPosts = async (page = 1, limit = 20) => {
  try {
    const response = await axios.get(`/api/posts/my-posts?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user posts:', error);
    throw error;
  }
};

// Public API calls
export const fetchPosts = async (page = 1, limit = 20) => {
  try {
    const response = await axios.get(`/api/posts?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching posts:', error);
    throw error;
  }
};

export const fetchPost = async (id) => {
  try {
    const response = await axios.get(`/api/posts/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching post:', error);
    throw error;
  }
};

export const sharePost = async (id) => {
  try {
    const response = await axios.post(`/api/posts/${id}/share`);
    return response.data;
  } catch (error) {
    console.error('Error sharing post:', error);
    throw error;
  }
};

// Authenticated API calls
export const createPost = async (postData) => {
  try {
    const response = await axios.post('/api/posts', postData);
    return response.data;
  } catch (error) {
    console.error('Error creating post:', error);
    throw error;
  }
};

export const updatePost = async (id, postData) => {
  try {
    const response = await axios.put(`/api/posts/${id}`, postData);
    return response.data;
  } catch (error) {
    console.error('Error updating post:', error);
    throw error;
  }
};

export const deletePost = async (id) => {
  try {
    const response = await axios.delete(`/api/posts/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting post:', error);
    throw error;
  }
};

// FIXED: Like functionality - consistent API calls using axios defaults
export const toggleLike = async (postId) => {
  try {
    const response = await axios.post(`/api/posts/${postId}/like`);
    return {
      liked: response.data.liked,
      likesCount: response.data.likesCount,
      action: response.data.action
    };
  } catch (error) {
    console.error('Error toggling like:', error);
    throw error;
  }
};

export const checkLikeStatus = async (postId) => {
  try {
    const response = await axios.get(`/api/posts/${postId}/liked`);
    return response.data;
  } catch (error) {
    console.error('Error checking like status:', error);
    return { hasLiked: false, likesCount: 0 };
  }
};

export const getPostAnalytics = async (id) => {
  try {
    const response = await axios.get(`/api/posts/${id}/analytics`);
    return response.data;
  } catch (error) {
    console.error('Error fetching analytics:', error);
    throw error;
  }
};

// Auth API calls
export const registerUser = async (userData) => {
  try {
    const response = await axios.post('/api/auth/register', userData);
    return response.data;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

export const loginUser = async (credentials) => {
  try {
    const response = await axios.post('/api/auth/login', credentials);
    return response.data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

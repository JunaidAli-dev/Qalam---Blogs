// src/hooks/usePosts.js
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import API_BASE_URL from '../config/api';

// Mock data as fallback when backend is unavailable
const mockPosts = [
  {
    id: 1,
    title: "Welcome to Qalam Blog",
    content: "This is a sample post while we connect to the database. Qalam is your modern Arabic-inspired blog platform built with React and Node.js.",
    username: "admin",
    views: 42,
    shares: 5,
    likesCount: 12,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    readTime: 2
  },
  {
    id: 2,
    title: "Getting Started with Modern Web Development",
    content: "Learn the fundamentals of React, Node.js, and full-stack development. This comprehensive guide covers everything you need to know to build amazing web applications.",
    username: "admin", 
    views: 28,
    shares: 3,
    likesCount: 8,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
    readTime: 5
  },
  {
    id: 3,
    title: "Building Responsive UI with Tailwind CSS",
    content: "Discover how to create beautiful, responsive user interfaces using Tailwind CSS. Learn about utility-first CSS and modern design principles.",
    username: "admin",
    views: 35,
    shares: 7,
    likesCount: 15,
    created_at: new Date(Date.now() - 172800000).toISOString(),
    updated_at: new Date(Date.now() - 172800000).toISOString(),
    readTime: 3
  }
];

export const usePosts = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUsingMockData, setIsUsingMockData] = useState(false);

  // Enhanced fetch posts with fallback to mock data
  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setIsUsingMockData(false);
      
      console.log('🔄 Fetching posts from:', `${API_BASE_URL}/api/posts`);
      console.log('🌐 Environment:', process.env.NODE_ENV);
      console.log('🔗 API Base URL:', API_BASE_URL);
      
      const response = await axios.get(`${API_BASE_URL}/api/posts`, {
        timeout: 15000, // 15 second timeout
        headers: {
          'Content-Type': 'application/json',
        },
        validateStatus: function (status) {
          return status >= 200 && status < 500; // Accept 4xx errors for handling
        }
      });
      
      console.log('✅ API Response status:', response.status);
      console.log('📊 Response data:', response.data);
      
      if (response.status === 200 && response.data) {
        setPosts(Array.isArray(response.data) ? response.data : []);
        console.log('✅ Successfully loaded', response.data.length, 'posts from API');
      } else {
        throw new Error(`API returned status ${response.status}`);
      }
    } catch (err) {
      console.error('❌ Error fetching posts:', err);
      console.log('🔄 Falling back to mock data...');
      
      // Use mock data as fallback
      setPosts(mockPosts);
      setIsUsingMockData(true);
      
      const errorMessage = err.code === 'ECONNREFUSED' 
        ? 'Backend server is not accessible. Using sample data.'
        : err.response?.data?.message || err.message || 'Failed to fetch posts. Using sample data.';
      
      setError(errorMessage);
      console.log('📝 Using mock data with', mockPosts.length, 'sample posts');
    } finally {
      setLoading(false);
    }
  }, []);

  const createPost = useCallback(async (postData) => {
    try {
      setError(null);
      console.log('📝 Creating post:', postData);
      
      // If using mock data, simulate post creation
      if (isUsingMockData) {
        const newPost = {
          id: Date.now(),
          ...postData,
          username: 'admin',
          views: 0,
          shares: 0,
          likesCount: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          readTime: Math.ceil(postData.content.split(' ').length / 200) || 1
        };
        setPosts(prev => [newPost, ...prev]);
        console.log('✅ Post created in mock data');
        return newPost;
      }
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required. Please log in.');
      }
      
      const response = await axios.post(`${API_BASE_URL}/api/posts`, postData, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      });
      
      setPosts(prev => [response.data, ...prev]);
      console.log('✅ Post created successfully');
      return response.data;
    } catch (err) {
      console.error('❌ Error creating post:', err);
      if (err.response?.status === 401) {
        setError('Authentication required. Please log in.');
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to create post');
      }
      throw err;
    }
  }, [isUsingMockData]);

  const updatePost = useCallback(async (id, postData) => {
    try {
      setError(null);
      console.log('✏️ Updating post:', id, postData);
      
      // If using mock data, simulate post update
      if (isUsingMockData) {
        setPosts(prev => prev.map(post => 
          post.id === parseInt(id) 
            ? { ...post, ...postData, updated_at: new Date().toISOString() }
            : post
        ));
        console.log('✅ Post updated in mock data');
        return { id: parseInt(id), ...postData };
      }
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required. Please log in.');
      }
      
      const response = await axios.put(`${API_BASE_URL}/api/posts/${id}`, postData, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      });
      
      setPosts(prev => prev.map(post => 
        post.id === parseInt(id) ? response.data : post
      ));
      console.log('✅ Post updated successfully');
      return response.data;
    } catch (err) {
      console.error('❌ Error updating post:', err);
      if (err.response?.status === 401) {
        setError('Authentication required. Please log in.');
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to update post');
      }
      throw err;
    }
  }, [isUsingMockData]);

  const deletePost = useCallback(async (id) => {
    try {
      setError(null);
      console.log('🗑️ Deleting post:', id);
      
      // If using mock data, simulate post deletion
      if (isUsingMockData) {
        setPosts(prev => prev.filter(post => post.id !== parseInt(id)));
        console.log('✅ Post deleted from mock data');
        return;
      }
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required. Please log in.');
      }
      
      await axios.delete(`${API_BASE_URL}/api/posts/${id}`, {
        headers: { 
          'Authorization': `Bearer ${token}`
        },
        timeout: 15000
      });
      
      setPosts(prev => prev.filter(post => post.id !== parseInt(id)));
      console.log('✅ Post deleted successfully');
    } catch (err) {
      console.error('❌ Error deleting post:', err);
      if (err.response?.status === 401) {
        setError('Authentication required. Please log in.');
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to delete post');
      }
      throw err;
    }
  }, [isUsingMockData]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const retryConnection = useCallback(async () => {
    console.log('🔄 Retrying connection to backend...');
    await fetchPosts();
  }, [fetchPosts]);

  // Initial fetch
  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Debug logging
  useEffect(() => {
    console.log('=== usePosts Debug Info ===');
    console.log('📊 Posts count:', posts.length);
    console.log('⏳ Loading:', loading);
    console.log('❌ Error:', error);
    console.log('🎭 Using mock data:', isUsingMockData);
    console.log('🔗 API Base URL:', API_BASE_URL);
    console.log('========================');
  }, [posts, loading, error, isUsingMockData]);

  return {
    posts,
    loading,
    error,
    isUsingMockData,
    fetchPosts,
    createPost,
    updatePost,
    deletePost,
    clearError,
    retryConnection
  };
};

export default usePosts;

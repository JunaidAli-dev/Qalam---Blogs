// src/hooks/usePosts.js
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

export const usePosts = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE_URL = 'http://localhost:3001/api';

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_BASE_URL}/posts`);
      setPosts(response.data);
    } catch (err) {
      setError('Failed to fetch posts');
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL]);

  const createPost = async (postData) => {
    try {
      setError(null);
      console.log('Creating post:', postData); // Debug log
      const response = await axios.post(`${API_BASE_URL}/posts`, postData);
      setPosts(prev => [response.data, ...prev]);
      return response.data;
    } catch (err) {
      console.error('Error creating post:', err);
      if (err.response?.status === 401) {
        setError('Authentication required. Please log in.');
      } else {
        setError('Failed to create post');
      }
      throw err;
    }
  };

  const updatePost = async (id, postData) => {
    try {
      setError(null);
      console.log('Updating post:', id, postData); // Debug log
      const response = await axios.put(`${API_BASE_URL}/posts/${id}`, postData);
      setPosts(prev => prev.map(post => 
        post.id === parseInt(id) ? response.data : post
      ));
      return response.data;
    } catch (err) {
      console.error('Error updating post:', err);
      if (err.response?.status === 401) {
        setError('Authentication required. Please log in.');
      } else {
        setError('Failed to update post');
      }
      throw err;
    }
  };

  const deletePost = async (id) => {
    try {
      setError(null);
      console.log('Deleting post:', id); // Debug log
      await axios.delete(`${API_BASE_URL}/posts/${id}`);
      setPosts(prev => prev.filter(post => post.id !== parseInt(id)));
    } catch (err) {
      console.error('Error deleting post:', err);
      if (err.response?.status === 401) {
        setError('Authentication required. Please log in.');
      } else {
        setError('Failed to delete post');
      }
      throw err;
    }
  };

  const clearError = () => {
    setError(null);
  };

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return {
    posts,
    loading,
    error,
    fetchPosts,
    createPost,
    updatePost,
    deletePost,
    clearError,
  };
};

export default usePosts;

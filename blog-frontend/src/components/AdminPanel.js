// src/components/AdminPanel.js
import React, { useState, useEffect } from 'react';
import { usePosts } from '../hooks/usePosts';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import WordLikeEditor from './WordLikeEditor';
import QalamLogo from './QalamLogo';
import axios from 'axios';
import API_BASE_URL from '../config/api';


const AdminPanel = () => {
  const { posts, loading, error, createPost, updatePost, deletePost, fetchPosts } = usePosts();
  const { user } = useAuth();
  const [formData, setFormData] = useState({ title: '', content: '' });
  const [editingId, setEditingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('create');
  const [stats, setStats] = useState({
    totalPosts: 0,
    totalViews: 0,
    totalLikes: 0,
    averageReadTime: 0
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [detailedPosts, setDetailedPosts] = useState([]);

  // Load draft from localStorage on component mount
  useEffect(() => {
    const savedDraft = localStorage.getItem('blog_draft');
    if (savedDraft && !editingId) {
      try {
        const draft = JSON.parse(savedDraft);
        if (draft.title || draft.content) {
          const loadDraft = window.confirm('Found a saved draft. Would you like to load it?');
          if (loadDraft) {
            setFormData(draft);
          }
        }
      } catch (error) {
        console.error('Error loading draft:', error);
      }
    }
  }, [editingId]);

  // Fetch detailed posts with real-time like/share counts
  const fetchDetailedPosts = async () => {
    try {
      const detailedPostsData = await Promise.all(
        posts.map(async (post) => {
          try {
            const response = await axios.get(`${API_BASE_URL}/api/posts/${post.id}`);
            return {
              ...post,
              likesCount: response.data.likesCount || 0,
              views: response.data.views || 0,
              shares: response.data.shares || 0
            };
          } catch (error) {
            console.error(`Error fetching post ${post.id}:`, error);
            return post;
          }
        })
      );
      setDetailedPosts(detailedPostsData);
      return detailedPostsData;
    } catch (error) {
      console.error('Error fetching detailed posts:', error);
      return posts;
    }
  };

  // Calculate stats from detailed posts
  const calculateStats = async () => {
    try {
      const detailedPostsData = await fetchDetailedPosts();

      const totalPosts = detailedPostsData.length;
      const totalViews = detailedPostsData.reduce((sum, post) => sum + (post.views || 0), 0);
      const totalLikes = detailedPostsData.reduce((sum, post) => sum + (post.likesCount || 0), 0);
      const averageReadTime = totalPosts > 0 
        ? Math.ceil(detailedPostsData.reduce((sum, post) => sum + (post.readTime || 1), 0) / totalPosts)
        : 0;

      setStats({
        totalPosts,
        totalViews,
        totalLikes,
        averageReadTime
      });

      console.log('Stats updated:', { totalPosts, totalViews, totalLikes, averageReadTime });
    } catch (error) {
      console.error('Error calculating stats:', error);
      const totalPosts = posts.length;
      const totalViews = posts.reduce((sum, post) => sum + (post.views || 0), 0);
      const totalLikes = posts.reduce((sum, post) => sum + (post.likesCount || 0), 0);
      const averageReadTime = totalPosts > 0 
        ? Math.ceil(posts.reduce((sum, post) => sum + (post.readTime || 1), 0) / totalPosts)
        : 0;

      setStats({
        totalPosts,
        totalViews,
        totalLikes,
        averageReadTime
      });
    }
  };

  // Manual refresh function
  const refreshStats = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      await fetchPosts();
      setTimeout(() => calculateStats(), 500);
      console.log('Stats refreshed successfully');
    } catch (error) {
      console.error('Error refreshing stats:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Calculate stats when posts change
  useEffect(() => {
    if (posts.length > 0) {
      calculateStats();
    }
  }, [posts]);

  // Auto-refresh stats every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (posts.length > 0) {
        calculateStats();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [posts]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (editingId) {
        await updatePost(editingId, formData);
        setEditingId(null);
        setActiveTab('manage');
      } else {
        await createPost(formData);
      }
      setFormData({ title: '', content: '' });
      localStorage.removeItem('blog_draft');
      setTimeout(() => {
        fetchPosts();
        calculateStats();
      }, 1000);
    } catch (error) {
      console.error('Error saving post:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (post) => {
    setFormData({ title: post.title, content: post.content });
    setEditingId(post.id);
    setActiveTab('create');
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      try {
        await deletePost(id);
        setTimeout(() => {
          fetchPosts();
          calculateStats();
        }, 1000);
      } catch (error) {
        console.error('Error deleting post:', error);
      }
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({ title: '', content: '' });
    localStorage.removeItem('blog_draft');
  };

  if (loading) {
    return <LoadingSpinner text="Loading admin panel..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={fetchPosts} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="flex justify-center mb-4 sm:mb-6">
            <QalamLogo width={48} height={48} className="sm:w-16 sm:h-16 animate-pulse" />
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
              Admin Dashboard
            </span>
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 px-4">
            Welcome back, <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">{user?.username}</span>! 
            Create amazing content with our advanced editor
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 border-l-4 border-indigo-500 transform hover:scale-105 transition-all duration-300 hover:shadow-xl">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 rounded-full bg-gradient-to-r from-indigo-100 to-indigo-200 text-indigo-600">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-3 sm:ml-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total Posts</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.totalPosts}</p>
                <p className="text-xs text-green-500">📈 Active</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 border-l-4 border-green-500 transform hover:scale-105 transition-all duration-300 hover:shadow-xl">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 rounded-full bg-gradient-to-r from-green-100 to-green-200 text-green-600">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <div className="ml-3 sm:ml-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total Views</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.totalViews}</p>
                <p className="text-xs text-green-500">👁️ Viewers</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 border-l-4 border-red-500 transform hover:scale-105 transition-all duration-300 hover:shadow-xl">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 rounded-full bg-gradient-to-r from-red-100 to-red-200 text-red-600">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <div className="ml-3 sm:ml-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total Likes</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 text-red-600">{stats.totalLikes}</p>
                <button 
                  onClick={refreshStats}
                  disabled={isRefreshing}
                  className="text-xs text-gray-500 hover:text-gray-700 mt-1 disabled:opacity-50 transition-colors truncate"
                >
                  {isRefreshing ? '🔄 Refreshing...' : '🔄 Refresh Now'}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 border-l-4 border-purple-500 transform hover:scale-105 transition-all duration-300 hover:shadow-xl">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 rounded-full bg-gradient-to-r from-purple-100 to-purple-200 text-purple-600">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3 sm:ml-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Avg. Read Time</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.averageReadTime} min</p>
                <p className="text-xs text-purple-500">⏱️ Reading</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Tabs */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          <div className="border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
            <nav className="flex space-x-4 sm:space-x-8 px-3 sm:px-6 overflow-x-auto">
              <button
                onClick={() => setActiveTab('create')}
                className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm transition-all duration-200 flex items-center space-x-1 sm:space-x-2 whitespace-nowrap ${
                  activeTab === 'create'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{editingId ? '✏️' : '📝'}</span>
                <span>{editingId ? 'Edit Post' : 'Create Post'}</span>
              </button>
              <button
                onClick={() => setActiveTab('manage')}
                className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm transition-all duration-200 flex items-center space-x-1 sm:space-x-2 whitespace-nowrap ${
                  activeTab === 'manage'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>📊</span>
                <span>Manage Posts ({stats.totalPosts})</span>
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm transition-all duration-200 flex items-center space-x-1 sm:space-x-2 whitespace-nowrap ${
                  activeTab === 'analytics'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>📈</span>
                <span>Analytics</span>
              </button>
            </nav>
          </div>

          <div className="p-3 sm:p-6">
            {activeTab === 'create' && (
              <WordLikeEditor 
                formData={formData}
                setFormData={setFormData}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                editingId={editingId}
                resetForm={resetForm}
              />
            )}

            {activeTab === 'manage' && (
              <PostManager 
                posts={detailedPosts.length > 0 ? detailedPosts : posts}
                onEdit={handleEdit}
                onDelete={handleDelete}
                setActiveTab={setActiveTab}
                refreshStats={refreshStats}
                isRefreshing={isRefreshing}
              />
            )}

            {activeTab === 'analytics' && (
              <AnalyticsPanel 
                stats={stats}
                posts={detailedPosts.length > 0 ? detailedPosts : posts}
                refreshStats={refreshStats}
                isRefreshing={isRefreshing}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Post Manager Component - Responsive
const PostManager = ({ posts, onEdit, onDelete, setActiveTab, refreshStats, isRefreshing }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredPosts = posts
    .filter(post => {
      const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           post.content.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || post.status === filterStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.created_at) - new Date(a.created_at);
        case 'likes':
          return (b.likesCount || 0) - (a.likesCount || 0);
        case 'views':
          return (b.views || 0) - (a.views || 0);
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

  if (posts.length === 0) {
    return (
      <div className="text-center py-8 sm:py-12">
        <div className="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No posts yet</h3>
        <p className="text-gray-600 mb-4 sm:mb-6 px-4">Create your first blog post with our advanced editor.</p>
        <button
          onClick={() => setActiveTab('create')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-colors duration-200 text-sm sm:text-base"
        >
          ✨ Create First Post
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Search and Filter Controls */}
      <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:gap-4 sm:items-center sm:justify-between bg-gray-50 p-3 sm:p-4 rounded-lg">
        <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:space-x-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search posts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-auto pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
            <svg className="absolute left-2 sm:left-3 top-2.5 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          
          <div className="flex space-x-2 sm:space-x-4">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="flex-1 sm:flex-none px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="date">📅 Sort by Date</option>
              <option value="likes">❤️ Sort by Likes</option>
              <option value="views">👁️ Sort by Views</option>
              <option value="title">🔤 Sort by Title</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="flex-1 sm:flex-none px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="all">All Posts</option>
              <option value="published">Published</option>
              <option value="draft">Drafts</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end space-x-2">
          <span className="text-xs sm:text-sm text-gray-600">
            {filteredPosts.length} of {posts.length} posts
          </span>
          <button
            onClick={refreshStats}
            disabled={isRefreshing}
            className="inline-flex items-center px-3 sm:px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 text-xs sm:text-sm"
          >
            <svg className={`w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="hidden sm:inline">{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
            <span className="sm:hidden">🔄</span>
          </button>
        </div>
      </div>

      {/* Posts List */}
      <div className="space-y-3 sm:space-y-4">
        {filteredPosts.map(post => (
          <div key={post.id} className="border border-gray-200 rounded-lg p-3 sm:p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-3 sm:space-y-0">
              <div className="flex-1 sm:mr-4 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 mb-2">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                    {post.title}
                  </h3>
                  <span className={`self-start px-2 py-1 text-xs rounded-full ${
                    post.status === 'published' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {post.status || 'published'}
                  </span>
                </div>
                
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  {post.content.replace(/<[^>]*>/g, '').length > 100 
                    ? `${post.content.replace(/<[^>]*>/g, '').substring(0, 100)}...` 
                    : post.content.replace(/<[^>]*>/g, '')
                  }
                </p>
                
                <div className="grid grid-cols-2 sm:flex sm:items-center sm:space-x-6 gap-2 sm:gap-0 text-xs text-gray-500">
                  <span className="flex items-center space-x-1">
                    <span>👤</span>
                    <span className="truncate">By: {post.username}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span>👁️</span>
                    <span>{post.views || 0} views</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span>❤️</span>
                    <span>{post.likesCount || 0} likes</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span>📤</span>
                    <span>{post.shares || 0} shares</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span>⏱️</span>
                    <span>~{post.readTime || 1} min read</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span>📅</span>
                    <span className="truncate">{new Date(post.created_at).toLocaleDateString()}</span>
                  </span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 sm:flex-col sm:space-x-0 sm:space-y-2 lg:flex-row lg:space-y-0 lg:space-x-2">
                <button 
                  onClick={() => onEdit(post)}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors duration-200"
                >
                  <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </button>
                <button 
                  onClick={() => onDelete(post.id)}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors duration-200"
                >
                  <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredPosts.length === 0 && searchTerm && (
        <div className="text-center py-6 sm:py-8">
          <p className="text-gray-500 text-sm sm:text-base">No posts found matching "{searchTerm}"</p>
        </div>
      )}
    </div>
  );
};

// Analytics Panel Component - Responsive
const AnalyticsPanel = ({ stats, posts, refreshStats, isRefreshing }) => {
  const [timeRange, setTimeRange] = useState('7days');

  const engagementRate = stats.totalViews > 0 
    ? ((stats.totalLikes / stats.totalViews) * 100).toFixed(1)
    : 0;

  const topPosts = posts
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 5);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Analytics Header */}
      <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">📈 Analytics Overview</h2>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value="7days">Last 7 days</option>
            <option value="30days">Last 30 days</option>
            <option value="90days">Last 90 days</option>
            <option value="all">All time</option>
          </select>
          <button
            onClick={refreshStats}
            disabled={isRefreshing}
            className="inline-flex items-center justify-center px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 text-sm"
          >
            <svg className={`w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh Data
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 sm:p-6 text-white">
          <h3 className="text-base sm:text-lg font-semibold mb-2">Engagement Rate</h3>
          <p className="text-2xl sm:text-3xl font-bold">{engagementRate}%</p>
          <p className="text-blue-100 text-xs sm:text-sm">Likes per view</p>
        </div>
        
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 sm:p-6 text-white">
          <h3 className="text-base sm:text-lg font-semibold mb-2">Avg. Views per Post</h3>
          <p className="text-2xl sm:text-3xl font-bold">
            {stats.totalPosts > 0 ? Math.round(stats.totalViews / stats.totalPosts) : 0}
          </p>
          <p className="text-green-100 text-xs sm:text-sm">Views per post</p>
        </div>
        
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 sm:p-6 text-white sm:col-span-2 lg:col-span-1">
          <h3 className="text-base sm:text-lg font-semibold mb-2">Content Performance</h3>
          <p className="text-2xl sm:text-3xl font-bold">
            {stats.totalLikes > 0 ? 'Good' : 'Growing'}
          </p>
          <p className="text-purple-100 text-xs sm:text-sm">Overall rating</p>
        </div>
      </div>

      {/* Top Performing Posts */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">🏆 Top Performing Posts</h3>
        {topPosts.length > 0 ? (
          <div className="space-y-3 sm:space-y-4">
            {topPosts.map((post, index) => (
              <div key={post.id} className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0">
                  <span className={`inline-flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full text-white font-bold text-xs sm:text-sm ${
                    index === 0 ? 'bg-yellow-500' : 
                    index === 1 ? 'bg-gray-400' : 
                    index === 2 ? 'bg-orange-500' : 'bg-gray-300'
                  }`}>
                    {index + 1}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 truncate">{post.title}</h4>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-gray-500 mt-1">
                    <span>👁️ {post.views || 0} views</span>
                    <span>❤️ {post.likesCount || 0} likes</span>
                    <span>📤 {post.shares || 0} shares</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-6 sm:py-8 text-sm sm:text-base">No posts available for analysis</p>
        )}
      </div>

      {/* Content Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">📊 Content Insights</h3>
          <div className="space-y-2 sm:space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 text-sm">Total Words Written</span>
              <span className="font-semibold text-sm">
                {posts.reduce((total, post) => {
                  const wordCount = post.content.replace(/<[^>]*>/g, '').trim().split(/\s+/).length;
                  return total + wordCount;
                }, 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 text-sm">Avg. Post Length</span>
              <span className="font-semibold text-sm">{stats.averageReadTime} min read</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 text-sm">Publishing Frequency</span>
              <span className="font-semibold text-sm">
                {stats.totalPosts > 0 ? `${Math.round(stats.totalPosts / 30)} posts/month` : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">🎯 Recommendations</h3>
          <div className="space-y-2 sm:space-y-3">
            {stats.totalViews < 100 && (
              <div className="flex items-start space-x-2">
                <span className="text-blue-500">💡</span>
                <span className="text-sm text-gray-600">Focus on SEO optimization to increase views</span>
              </div>
            )}
            {engagementRate < 5 && (
              <div className="flex items-start space-x-2">
                <span className="text-green-500">💡</span>
                <span className="text-sm text-gray-600">Add more engaging content to improve likes</span>
              </div>
            )}
            {stats.averageReadTime < 2 && (
              <div className="flex items-start space-x-2">
                <span className="text-purple-500">💡</span>
                <span className="text-sm text-gray-600">Consider writing longer, more detailed posts</span>
              </div>
            )}
            {stats.totalPosts < 5 && (
              <div className="flex items-start space-x-2">
                <span className="text-orange-500">💡</span>
                <span className="text-sm text-gray-600">Publish more content to build your audience</span>
              </div>
            )}
            {stats.totalViews >= 100 && engagementRate >= 5 && stats.averageReadTime >= 2 && stats.totalPosts >= 5 && (
              <div className="flex items-start space-x-2">
                <span className="text-green-500">🎉</span>
                <span className="text-sm text-gray-600">Great job! Your blog is performing well across all metrics</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;

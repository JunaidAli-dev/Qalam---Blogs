// src/components/PostList.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePosts } from '../hooks/usePosts';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import QalamLogo from './QalamLogo';
import axios from 'axios';
import API_BASE_URL from '../config/api';


// Helper function to format dates safely
const formatDate = (dateString) => {
  try {
    if (!dateString) return 'Date not available';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Date not available';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    return 'Date not available';
  }
};

// Enhanced content preview function
const getPreviewContent = (content) => {
  if (!content) return 'No content available';
  
  const cleanText = content
    .replace(/<img[^>]*>/g, '')
    .replace(/<video[^>]*>.*?<\/video>/g, '')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
  
  return cleanText.length > 80 ? `${cleanText.substring(0, 80)}...` : cleanText;
};

// Extract first image from content - Fixed version
const getFirstImage = (content) => {
  if (!content) return null;
  
  try {
    // Try to match img tags with src attribute
    const imgMatch = content.match(/<img[^>]+src\s*=\s*["']([^"']+)["'][^>]*>/i);
    if (imgMatch && imgMatch[1]) {
      // Validate URL
      const url = imgMatch[1].trim();
      if (url.startsWith('http') || url.startsWith('/') || url.startsWith('data:')) {
        return url;
      }
    }
    return null;
  } catch (error) {
    console.error('Error extracting image:', error);
    return null;
  }
};

const PostCard = ({ post }) => {
  const { isAuthenticated } = useAuth();
  const [likes, setLikes] = useState(post.likesCount || 0);
  const [shares, setShares] = useState(post.shares || 0);
  const [hasLiked, setHasLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  React.useEffect(() => {
    if (isAuthenticated) {
      checkLikeStatus();
    }
  }, [isAuthenticated, post.id]);

  const checkLikeStatus = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/posts/${post.id}/liked`);
      setHasLiked(response.data.hasLiked);
      setLikes(response.data.likesCount);
    } catch (error) {
      console.error('Error checking like status:', error);
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated) {
      alert('Please log in to like posts');
      return;
    }

    if (isLiking) return;
    
    setIsLiking(true);
    try {
      if (hasLiked) {
        const response = await axios.delete(`${API_BASE_URL}/api/posts/${post.id}/like`);
        setLikes(response.data.likesCount);
        setHasLiked(false);
      } else {
        const response = await axios.post(`${API_BASE_URL}/api/posts/${post.id}/like`);
        setLikes(response.data.likesCount);
        setHasLiked(true);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      if (error.response?.status === 400) {
        checkLikeStatus();
      }
    } finally {
      setIsLiking(false);
    }
  };

  const handleShare = async () => {
    if (isSharing) return;
    
    setIsSharing(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/posts/${post.id}/share`);
      setShares(response.data.shares);
      
      const postUrl = `${window.location.origin}/post/${post.id}`;
      await navigator.clipboard.writeText(postUrl);
      alert('Post link copied to clipboard!');
    } catch (error) {
      console.error('Error sharing post:', error);
      const postUrl = `${window.location.origin}/post/${post.id}`;
      try {
        await navigator.clipboard.writeText(postUrl);
        alert('Post link copied to clipboard!');
      } catch (clipboardError) {
        console.error('Clipboard error:', clipboardError);
      }
    } finally {
      setIsSharing(false);
    }
  };

  const firstImage = getFirstImage(post.content);
  const previewText = getPreviewContent(post.content);

  // Handle image load error
  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(false);
  };

  // Handle image load success
  const handleImageLoad = () => {
    setImageError(false);
    setImageLoaded(true);
  };

  return (
    <article className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 group">
      <div className="flex flex-col md:flex-row min-h-[280px]">
        {/* Image Section - Fixed height with proper margins */}
        <div className="w-full h-48 md:w-64 md:h-auto flex-shrink-0 relative overflow-hidden bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 m-3 rounded-xl">
          {firstImage && !imageError ? (
            <>
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              )}
              <img 
                src={firstImage} 
                alt={post.title}
                className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 rounded-xl ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={handleImageLoad}
                onError={handleImageError}
                loading="lazy"
              />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center rounded-xl">
              <QalamLogo width={48} height={48} />
            </div>
          )}
          
          {/* Category Badge */}
          <div className="absolute top-3 left-3">
            <span className="inline-block px-3 py-1 text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full backdrop-blur-sm bg-opacity-90 shadow-lg">
              Article
            </span>
          </div>
        </div>
        
        {/* Content Section - Fixed layout */}
        <div className="flex-1 p-4 md:p-6 flex flex-col min-h-0">
          <div className="flex-1 min-h-0">
            {/* Header */}
            <div className="flex flex-col space-y-2 md:flex-row md:items-start md:justify-between md:space-y-0 mb-3">
              <div className="flex items-center space-x-3 min-w-0">
                <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                  <span className="text-white font-bold text-sm">
                    {post.username ? post.username.charAt(0).toUpperCase() : 'U'}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 truncate">{post.username || 'Unknown User'}</p>
                  <p className="text-xs text-gray-500">{formatDate(post.created_at)}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 text-sm text-gray-500 flex-shrink-0">
                <div className="flex items-center space-x-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span className="font-medium">{post.views || 0}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">{post.readTime || 1} min</span>
                </div>
              </div>
            </div>
            
            {/* Title */}
            <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-2 hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-indigo-600 hover:to-purple-600 transition-all duration-200 line-clamp-2 leading-tight">
              <Link to={`/post/${post.id}`} className="block">
                {post.title}
              </Link>
            </h2>
            
            {/* Preview Text */}
            <p className="text-gray-600 leading-relaxed text-sm line-clamp-2 mb-4 flex-1">
              {previewText}
            </p>
          </div>
          
          {/* Footer - Always visible at bottom */}
          <div className="flex flex-col space-y-3 md:flex-row md:items-center md:justify-between md:space-y-0 pt-4 border-t border-gray-100 mt-auto">
            <Link 
              to={`/post/${post.id}`}
              className="inline-flex items-center text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 font-semibold transition-all duration-200 group text-sm md:text-base"
            >
              Read more
              <svg className="ml-2 w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-200 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={handleLike}
                disabled={isLiking}
                className={`flex items-center space-x-2 transition-all duration-200 disabled:opacity-50 px-3 py-2 rounded-full text-sm font-medium shadow-md hover:shadow-lg ${
                  hasLiked 
                    ? 'text-red-500 bg-red-50 border border-red-200' 
                    : 'text-gray-500 hover:text-red-500 hover:bg-red-50 border border-gray-200 hover:border-red-200'
                }`}
              >
                <svg 
                  className="w-4 h-4" 
                  fill={hasLiked ? "currentColor" : "none"} 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span>{likes}</span>
              </button>
              
              <button
                onClick={handleShare}
                disabled={isSharing}
                className="flex items-center space-x-2 text-gray-500 hover:text-indigo-500 hover:bg-indigo-50 transition-all duration-200 disabled:opacity-50 px-3 py-2 rounded-full text-sm font-medium border border-gray-200 hover:border-indigo-200 shadow-md hover:shadow-lg"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
                <span>{shares}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};

const PostList = () => {
  const { posts, loading, error, fetchPosts } = usePosts();

  if (loading) {
    return <LoadingSpinner text="Loading amazing posts..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={fetchPosts} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50">
      <div className="max-w-5xl mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8 lg:py-12">
        {/* Hero Section */}
        <div className="text-center mb-8 sm:mb-12 lg:mb-16">
          <div className="flex justify-center mb-6">
            <QalamLogo width={80} height={80} className="animate-pulse" />
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
              Welcome to Qalam
            </span>
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed px-4">
            Discover insights, tutorials, and stories about technology, development, and innovation. 
            Join me on this journey of continuous learning and growth.
          </p>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-12 sm:py-16">
            <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 mx-auto mb-6 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full flex items-center justify-center">
              <QalamLogo width={48} height={48} />
            </div>
            <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 mb-4">
              No posts yet
            </h3>
            <p className="text-gray-600 mb-6 sm:mb-8 max-w-md mx-auto px-4">
              It looks like there are no blog posts available at the moment. Be the first to create one!
            </p>
            <Link 
              to="/admin" 
              className="inline-flex items-center bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 text-sm sm:text-base"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create your first post
            </Link>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 space-y-3 sm:space-y-0">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                Latest Posts
              </h2>
              <div className="flex items-center justify-between sm:justify-end space-x-4">
                <span className="text-sm sm:text-base text-gray-600 font-medium">{posts.length} {posts.length === 1 ? 'post' : 'posts'}</span>
                <div className="h-4 w-px bg-gray-300 hidden sm:block"></div>
                <Link 
                  to="/admin" 
                  className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 font-semibold transition-all duration-200 text-sm sm:text-base"
                >
                  Write a post
                </Link>
              </div>
            </div>
            
            {/* Posts List */}
            <div className="space-y-6 sm:space-y-8">
              {posts.map(post => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PostList;

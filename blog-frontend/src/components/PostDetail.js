// src/components/PostDetail.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import QalamLogo from './QalamLogo';
import axios from 'axios';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import API_BASE_URL from '../config/api';


// Enhanced content renderer for TinyMCE HTML content
const renderContent = (content) => {
  if (!content) return '';
  
  // The content from TinyMCE is already HTML, so we just need to ensure proper styling
  return content;
};

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

// Extract first image from content
const getFirstImage = (content) => {
  if (!content) return null;
  
  try {
    const imgMatch = content.match(/<img[^>]+src\s*=\s*["']([^"']+)["'][^>]*>/i);
    if (imgMatch && imgMatch[1]) {
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

const PostDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasLiked, setHasLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [heroImageError, setHeroImageError] = useState(false);

  const fetchPost = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_BASE_URL}/api/posts/${id}`);
      setPost(response.data);
      
      if (isAuthenticated) {
        try {
          const likeResponse = await axios.get(`${API_BASE_URL}/api/posts/${id}liked`);
          setHasLiked(likeResponse.data.hasLiked);
        } catch (likeError) {
          console.error('Error checking like status:', likeError);
        }
      }
    } catch (err) {
      setError('Post not found');
    } finally {
      setLoading(false);
    }
  }, [id, isAuthenticated]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  const handleLike = async () => {
    if (!isAuthenticated) {
      alert('Please log in to like posts');
      return;
    }

    if (isLiking) return;
    
    setIsLiking(true);
    try {
      if (hasLiked) {
        const response = await axios.delete(`${API_BASE_URL}/api/posts/${id}/like`);
        setPost(prev => ({ ...prev, likesCount: response.data.likesCount }));
        setHasLiked(false);
      } else {
        const response = await axios.post(`${API_BASE_URL}/api/posts/${id}/like`);
        setPost(prev => ({ ...prev, likesCount: response.data.likesCount }));
        setHasLiked(true);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      if (error.response?.status === 400) {
        fetchPost();
      }
    } finally {
      setIsLiking(false);
    }
  };

  const handleShare = async () => {
    if (isSharing) return;
    
    setIsSharing(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/posts/${id}/share`);
      setPost(prev => ({ ...prev, shares: response.data.shares }));
      
      const postUrl = `${window.location.origin}/post/${id}`;
      await navigator.clipboard.writeText(postUrl);
      alert('Post link copied to clipboard!');
    } catch (error) {
      console.error('Error sharing post:', error);
      const postUrl = `${window.location.origin}/post/${id}`;
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

  if (loading) {
    return <LoadingSpinner text="Loading post..." />;
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <ErrorMessage 
          message={error} 
          onRetry={() => navigate('/')} 
        />
      </div>
    );
  }

  const heroImage = getFirstImage(post.content);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50">
      <div className="max-w-5xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
        {/* Navigation */}
        <nav className="mb-6 sm:mb-8">
          <Link 
            to="/" 
            className="inline-flex items-center text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 font-semibold transition-all duration-200 group text-sm sm:text-base"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 transform group-hover:-translate-x-1 transition-transform duration-200 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to all posts
          </Link>
        </nav>
        
        <article className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
          {/* Hero Section with Image */}
          <div className="relative">
            {heroImage && !heroImageError ? (
              <div className="h-48 sm:h-64 md:h-80 lg:h-96 overflow-hidden">
                <img 
                  src={heroImage}
                  alt={post.title}
                  className="w-full h-full object-cover"
                  onError={() => setHeroImageError(true)}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
              </div>
            ) : (
              <div className="h-48 sm:h-64 md:h-80 lg:h-96 bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 flex items-center justify-center">
                <QalamLogo width={80} height={80} className="sm:w-[120px] sm:h-[120px]" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent"></div>
              </div>
            )}
            
            {/* Header Content Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-8 lg:p-12 text-white">
              <div className="max-w-4xl">
                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 mb-3 sm:mb-4">
                  <span className="inline-block px-3 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
                    Article
                  </span>
                  <time className="text-white/90 font-medium text-sm sm:text-base">
                    {formatDate(post.created_at)}
                  </time>
                </div>
                
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold leading-tight mb-4 sm:mb-6 text-shadow-lg">
                  {post.title}
                </h1>
                
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30">
                      <span className="text-white font-bold text-sm sm:text-base md:text-lg">
                        {post.username ? post.username.charAt(0).toUpperCase() : 'U'}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-sm sm:text-base md:text-lg">{post.username || 'Unknown User'}</p>
                      <p className="text-white/80 text-xs sm:text-sm">Author</p>
                    </div>
                  </div>
                  
                  <div className="hidden sm:flex items-center space-x-4 lg:space-x-6 text-white/90">
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-medium text-sm sm:text-base">{post.readTime || 1} min read</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span className="font-medium text-sm sm:text-base">{post.views || 0} views</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="px-4 sm:px-6 md:px-8 lg:px-12 py-6 sm:py-8 md:py-12">
            <div className="max-w-4xl mx-auto">
              {/* Mobile stats */}
              <div className="sm:hidden flex items-center justify-center space-x-4 sm:space-x-6 text-gray-600 mb-6 sm:mb-8 p-3 sm:p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium">{post.readTime || 1} min read</span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span className="text-sm font-medium">{post.views || 0} views</span>
                </div>
              </div>

              {/* Article Content */}
              <div className="prose prose-sm sm:prose-base lg:prose-lg max-w-none">
                <div 
                  dangerouslySetInnerHTML={{ __html: renderContent(post.content) }}
                  className="text-gray-700 leading-relaxed text-base sm:text-lg break-words"
                  style={{
                    // Enhanced styling for TinyMCE content with responsive images
                    lineHeight: '1.8',
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Interaction Footer */}
          <div className="bg-gradient-to-r from-gray-50 to-indigo-50 px-4 sm:px-6 md:px-8 lg:px-12 py-6 sm:py-8 border-t border-gray-200">
            <div className="max-w-4xl mx-auto">
              <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                  <button
                    onClick={handleLike}
                    disabled={isLiking}
                    className={`flex items-center justify-center space-x-2 sm:space-x-3 px-4 sm:px-6 py-3 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:scale-105 text-sm sm:text-base ${
                      hasLiked 
                        ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white' 
                        : 'bg-white text-gray-700 hover:bg-gradient-to-r hover:from-red-500 hover:to-pink-500 hover:text-white border border-gray-200'
                    }`}
                  >
                    <svg 
                      className="w-4 h-4 sm:w-5 sm:h-5" 
                      fill={hasLiked ? "currentColor" : "none"} 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <span>{post.likesCount || 0} {hasLiked ? 'Liked' : 'Like'}</span>
                  </button>
                  
                  <button
                    onClick={handleShare}
                    disabled={isSharing}
                    className="flex items-center justify-center space-x-2 sm:space-x-3 px-4 sm:px-6 py-3 rounded-xl bg-white text-gray-700 hover:bg-gradient-to-r hover:from-indigo-500 hover:to-purple-500 hover:text-white font-semibold transition-all duration-200 disabled:opacity-50 border border-gray-200 shadow-lg hover:shadow-xl transform hover:scale-105 text-sm sm:text-base"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                    </svg>
                    <span>{post.shares || 0} Share</span>
                  </button>
                </div>
                
                {!isAuthenticated && (
                  <div className="text-xs sm:text-sm text-gray-600 bg-white px-3 sm:px-4 py-2 rounded-lg border border-gray-200 text-center sm:text-left">
                    <Link to="/login" className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 font-semibold">
                      Login
                    </Link> to like and interact with posts
                  </div>
                )}
              </div>
            </div>
          </div>
        </article>
      </div>

      {/* Custom CSS for text shadow */}
      <style jsx>{`
        .text-shadow-lg {
          text-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        }
        
        /* Responsive content styling */
        .prose img {
          max-width: 100% !important;
          height: auto !important;
          border-radius: 8px;
          margin: 1rem auto;
        }
        
        .prose table {
          width: 100% !important;
          overflow-x: auto;
          display: block;
          white-space: nowrap;
        }
        
        @media (max-width: 640px) {
          .prose table {
            font-size: 0.875rem;
          }
        }
      `}</style>
    </div>
  );
};

export default PostDetail;

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { toggleLike, checkLikeStatus, sharePost } from '../services/api';

const PostCard = ({ post, onPostUpdate }) => {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  const [sharesCount, setSharesCount] = useState(post.shares || 0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && post.id) {
      checkUserLikeStatus();
    }
  }, [user, post.id]);

  const checkUserLikeStatus = async () => {
    try {
      const response = await checkLikeStatus(post.id);
      setIsLiked(response.hasLiked);
      setLikesCount(response.likesCount);
    } catch (error) {
      console.error('Error checking like status:', error);
    }
  };

  const handleLike = async () => {
    if (!user) {
      alert('Please login to like posts');
      return;
    }

    if (loading) return;

    try {
      setLoading(true);
      const response = await toggleLike(post.id);
      
      setIsLiked(response.liked);
      setLikesCount(response.likesCount);
      
      if (onPostUpdate) {
        onPostUpdate(post.id, { likesCount: response.likesCount });
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      alert('Failed to like post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      const response = await sharePost(post.id);
      setSharesCount(response.shares);
      
      if (onPostUpdate) {
        onPostUpdate(post.id, { shares: response.shares });
      }

      // Copy link to clipboard
      const postUrl = `${window.location.origin}/posts/${post.id}`;
      await navigator.clipboard.writeText(postUrl);
      alert('Post link copied to clipboard!');
    } catch (error) {
      console.error('Error sharing post:', error);
      alert('Failed to share post. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const canManagePost = user && user.id === post.user_id;

  return (
    <article className="post-card bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
      <div className="p-6">
        {/* Post Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">
                {post.username?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">{post.username}</h4>
              <p className="text-sm text-gray-500">{formatDate(post.created_at)}</p>
            </div>
          </div>
          
          {canManagePost && (
            <div className="flex space-x-2">
              <button 
                onClick={() => window.location.href = `/edit-post/${post.id}`}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Edit
              </button>
            </div>
          )}
        </div>

        {/* Post Content */}
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900 mb-3 hover:text-blue-600 cursor-pointer">
            <a href={`/posts/${post.id}`}>{post.title}</a>
          </h2>
          <p className="text-gray-700 leading-relaxed line-clamp-3">
            {post.content.length > 200 
              ? `${post.content.substring(0, 200)}...` 
              : post.content
            }
          </p>
          {post.content.length > 200 && (
            <a 
              href={`/posts/${post.id}`}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-2 inline-block"
            >
              Read more
            </a>
          )}
        </div>

        {/* Post Stats */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-6">
            {/* Like Button */}
            <button
              onClick={handleLike}
              disabled={loading}
              className={`flex items-center space-x-2 transition-colors duration-200 ${
                isLiked 
                  ? 'text-red-600 hover:text-red-700' 
                  : 'text-gray-500 hover:text-red-600'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <svg 
                className={`w-5 h-5 ${isLiked ? 'fill-current' : 'stroke-current fill-none'}`}
                viewBox="0 0 24 24" 
                strokeWidth="2"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
                />
              </svg>
              <span className="font-medium">{likesCount}</span>
            </button>

            {/* Views */}
            <div className="flex items-center space-x-2 text-gray-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span className="font-medium">{post.views || 0}</span>
            </div>

            {/* Share Button */}
            <button
              onClick={handleShare}
              className="flex items-center space-x-2 text-gray-500 hover:text-blue-600 transition-colors duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
              <span className="font-medium">{sharesCount}</span>
            </button>
          </div>

          {/* Read Time */}
          {post.readTime && (
            <div className="text-sm text-gray-500">
              {post.readTime} min read
            </div>
          )}
        </div>
      </div>
    </article>
  );
};

export default PostCard;

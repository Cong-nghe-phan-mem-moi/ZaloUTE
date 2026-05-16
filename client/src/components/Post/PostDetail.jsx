import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  getPost,
  toggleLike,
  getPostLikes,
  getPostComments,
  clearError,
} from '../../store/slices/postSlice';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';

const PostDetail = ({ postId, onClose }) => {
  const dispatch = useDispatch();
  const { currentPost, loading, error, comments } = useSelector(
    (state) => state.posts
  );

  useEffect(() => {
    if (postId) {
      dispatch(getPost(postId));
    }
  }, [postId, dispatch]);

  const handleToggleLike = () => {
    if (currentPost) {
      dispatch(toggleLike(currentPost._id));
    }
  };

  const handleViewLikes = () => {
    if (currentPost) {
      dispatch(getPostLikes({ postId: currentPost._id, page: 1, limit: 50 }));
    }
  };

  const handleViewComments = () => {
    if (currentPost) {
      dispatch(getPostComments({ postId: currentPost._id, page: 1, limit: 50 }));
    }
  };

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="p-4">
        <ErrorMessage message={error} onClose={() => dispatch(clearError())} />
      </div>
    );
  }

  if (!currentPost) {
    return <div className="p-4 text-center text-gray-500">Không tìm thấy bài viết</div>;
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <img
            src={currentPost.author?.avatar || '/default-avatar.png'}
            alt={currentPost.author?.fullName}
            className="w-12 h-12 rounded-full object-cover"
          />
          <div>
            <h3 className="font-semibold text-gray-900">
              {currentPost.author?.fullName}
            </h3>
            <p className="text-sm text-gray-500">
              {formatDistanceToNow(new Date(currentPost.createdAt), {
                addSuffix: true,
                locale: vi,
              })}
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="text-gray-800 text-base leading-relaxed mb-4">
          {currentPost.content}
        </p>

        {/* Media */}
        {currentPost.media && currentPost.media.length > 0 && (
          <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-2">
            {currentPost.media.map((item, index) => (
              <div key={index} className="rounded-lg overflow-hidden bg-gray-200">
                {item.type === 'image' ? (
                  <img
                    src={item.url}
                    alt={`Post media ${index}`}
                    className="w-full h-auto max-h-96 object-cover"
                  />
                ) : (
                  <video
                    src={item.url}
                    controls
                    className="w-full h-auto max-h-96 object-cover"
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="px-4 py-3 border-t border-b text-sm text-gray-600 flex justify-between">
        <button
          onClick={handleViewLikes}
          className="hover:text-blue-500 transition"
        >
          {currentPost.likes?.length || 0} lượt thích
        </button>
        <button
          onClick={handleViewComments}
          className="hover:text-blue-500 transition"
        >
          {currentPost.commentCount || 0} bình luận
        </button>
      </div>

      {/* Actions */}
      <div className="p-3 flex gap-2 text-gray-600 border-t">
        <button
          onClick={handleToggleLike}
          className={`flex-1 py-2 rounded-lg transition flex items-center justify-center gap-2 ${
            currentPost.isLiked
              ? 'bg-blue-100 text-blue-600 font-semibold'
              : 'hover:bg-gray-100'
          }`}
        >
          <span>👍</span>
          {currentPost.isLiked ? 'Bỏ thích' : 'Thích'}
        </button>
        <button className="flex-1 py-2 rounded-lg hover:bg-gray-100 transition flex items-center justify-center gap-2">
          <span>💬</span>
          Bình luận
        </button>
        <button className="flex-1 py-2 rounded-lg hover:bg-gray-100 transition flex items-center justify-center gap-2">
          <span>↗️</span>
          Chia sẻ
        </button>
      </div>

      {/* Comments Section */}
      {comments.length > 0 && (
        <div className="p-4 bg-gray-50 border-t">
          <h4 className="font-semibold mb-3 text-gray-800">Bình luận</h4>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {comments.map((comment) => (
              <div key={comment._id} className="flex gap-3">
                <img
                  src={comment.author?.avatar || '/default-avatar.png'}
                  alt={comment.author?.fullName}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div className="flex-1 bg-white rounded-lg p-2">
                  <p className="font-semibold text-sm text-gray-900">
                    {comment.author?.fullName}
                  </p>
                  <p className="text-sm text-gray-700">{comment.content}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDistanceToNow(new Date(comment.createdAt), {
                      addSuffix: true,
                      locale: vi,
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PostDetail;

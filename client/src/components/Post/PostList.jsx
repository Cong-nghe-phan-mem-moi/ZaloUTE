import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  getNewsFeed,
  toggleLike,
  deletePost,
  clearError,
} from '../../store/slices/postSlice';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import PostDetail from './PostDetail';
import EditPost from './EditPost';

const PostList = () => {
  const dispatch = useDispatch();
  const { posts, loading, error, pagination } = useSelector(
    (state) => state.posts
  );
  const currentUser = useSelector((state) => state.user?.profile);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [editingPostId, setEditingPostId] = useState(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    dispatch(getNewsFeed({ page, limit: 10 }));
  }, [page, dispatch]);

  const handleToggleLike = (postId) => {
    dispatch(toggleLike(postId));
  };

  const handleDeletePost = (postId) => {
    if (window.confirm('Bạn có chắc muốn xóa bài viết này?')) {
      dispatch(deletePost(postId));
    }
  };

  const handleLoadMore = () => {
    setPage((prev) => prev + 1);
  };

  if (loading && posts.length === 0) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <ErrorMessage message={error} onClose={() => dispatch(clearError())} />
      </div>
    );
  }

  if (selectedPostId) {
    return (
      <div className="max-w-2xl mx-auto">
        <PostDetail
          postId={selectedPostId}
          onClose={() => setSelectedPostId(null)}
        />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-8">
      {posts.length === 0 ? (
        <div className="p-8 text-center text-gray-500 bg-white rounded-lg">
          <p className="text-lg">Không có bài viết nào</p>
          <p className="text-sm mt-2">Hãy follow bạn bè để xem bài viết của họ</p>
        </div>
      ) : (
        <>
          {posts.map((post) => (
            <div
              key={post._id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <div className="flex items-center gap-3 flex-1">
                  <img
                    src={post.author?.avatar || '/default-avatar.png'}
                    alt={post.author?.fullName}
                    className="w-12 h-12 rounded-full object-cover cursor-pointer hover:opacity-80"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 cursor-pointer hover:text-blue-600">
                      {post.author?.fullName}
                    </h3>
                    <p
                      className="text-sm text-gray-500 cursor-pointer hover:text-gray-700"
                      onClick={() => setSelectedPostId(post._id)}
                    >
                      {formatDistanceToNow(new Date(post.createdAt), {
                        addSuffix: true,
                        locale: vi,
                      })}
                    </p>
                  </div>
                </div>

                {/* Menu */}
                {currentUser?.userId === post.author?._id && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingPostId(post._id)}
                      className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"
                    >
                      ✎
                    </button>
                    <button
                      onClick={() => handleDeletePost(post._id)}
                      className="text-gray-400 hover:text-red-600 p-1 rounded hover:bg-gray-100"
                    >
                      🗑
                    </button>
                  </div>
                )}
              </div>

              {/* Content */}
              <div
                className="p-4 cursor-pointer hover:bg-gray-50 transition"
                onClick={() => setSelectedPostId(post._id)}
              >
                <p className="text-gray-800 text-base leading-relaxed mb-3 line-clamp-5">
                  {post.content}
                </p>

                {/* Media Preview */}
                {post.media && post.media.length > 0 && (
                  <div className="mb-3 grid gap-2 grid-cols-2">
                    {post.media.slice(0, 4).map((item, index) => (
                      <div
                        key={index}
                        className="rounded-lg overflow-hidden bg-gray-200 relative"
                      >
                        {item.type === 'image' ? (
                          <img
                            src={item.url}
                            alt={`Post media ${index}`}
                            className="w-full h-48 object-cover"
                          />
                        ) : (
                          <video
                            src={item.url}
                            className="w-full h-48 object-cover"
                          />
                        )}
                        {post.media.length > 4 && index === 3 && (
                          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white text-xl font-bold">
                            +{post.media.length - 4}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="px-4 py-2 border-t border-b border-gray-100 text-sm text-gray-600 flex justify-between">
                <button
                  onClick={() => setSelectedPostId(post._id)}
                  className="hover:text-blue-500 transition"
                >
                  {post.likes?.length || 0} thích
                </button>
                <button
                  onClick={() => setSelectedPostId(post._id)}
                  className="hover:text-blue-500 transition"
                >
                  {post.commentCount || 0} bình luận
                </button>
              </div>

              {/* Actions */}
              <div className="p-2 flex gap-1 text-gray-600">
                <button
                  onClick={() => handleToggleLike(post._id)}
                  className={`flex-1 py-2 rounded-lg transition flex items-center justify-center gap-2 font-medium ${
                    post.isLiked
                      ? 'bg-blue-100 text-blue-600'
                      : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  <span className="text-lg">👍</span>
                  {post.isLiked ? 'Bỏ thích' : 'Thích'}
                </button>
                <button
                  onClick={() => setSelectedPostId(post._id)}
                  className="flex-1 py-2 rounded-lg hover:bg-gray-100 transition flex items-center justify-center gap-2 font-medium text-gray-600"
                >
                  <span className="text-lg">💬</span>
                  Bình luận
                </button>
                <button className="flex-1 py-2 rounded-lg hover:bg-gray-100 transition flex items-center justify-center gap-2 font-medium text-gray-600">
                  <span className="text-lg">↗️</span>
                  Chia sẻ
                </button>
              </div>
            </div>
          ))}

          {/* Load More Button */}
          {pagination && pagination.page < pagination.totalPages && (
            <div className="text-center py-4">
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="px-8 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-lg font-medium transition"
              >
                {loading ? 'Đang tải...' : 'Xem thêm'}
              </button>
            </div>
          )}
        </>
      )}

      {/* Edit Post Modal */}
      <EditPost
        post={posts.find((p) => p._id === editingPostId)}
        isOpen={!!editingPostId}
        onClose={() => setEditingPostId(null)}
        onPostUpdated={() => {
          setEditingPostId(null);
          dispatch(getNewsFeed({ page, limit: 10 }));
        }}
      />

      {/* Post Detail Modal */}
      <PostDetail
        postId={selectedPostId}
        isOpen={!!selectedPostId}
        onClose={() => setSelectedPostId(null)}
      />
    </div>
  );
};

export default PostList;

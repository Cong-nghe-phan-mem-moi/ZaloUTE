import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getPost, toggleLike } from "../../store/slices/postSlice";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import LoadingSpinner from "../common/LoadingSpinner";
import ErrorMessage from "../common/ErrorMessage";
import CommentSection from "./CommentSection";

const PostDetail = ({ postId, onClose }) => {
  const dispatch = useDispatch();
  const { currentPost, loading, error } = useSelector((state) => state.posts);

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

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="p-4">
        <ErrorMessage message={error} onClose={() => {}} />
      </div>
    );
  }

  if (!currentPost) {
    return (
      <div className="p-4 text-center text-gray-500">
        Không tìm thấy bài viết
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <img
            src={currentPost.author?.avatar || "/default-avatar.png"}
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
              <div
                key={index}
                className="rounded-lg overflow-hidden bg-gray-200"
              >
                {item.type === "image" ? (
                  <img
                    src={item.url}
                    alt={`Post media ${index}`}
                    className="w-full h-auto max-h-96 object-cover"
                    onError={(e) => {
                      console.error(`Image failed to load: ${item.url}`);
                      e.target.style.display = "none";
                    }}
                  />
                ) : (
                  <video
                    src={item.url}
                    controls
                    className="w-full h-auto max-h-96 object-cover"
                    onError={(e) => {
                      console.error(`Video failed to load: ${item.url}`);
                      e.target.style.display = "none";
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="px-4 py-3 border-t border-b text-sm text-gray-600 flex justify-between">
        <div>{currentPost.likes?.length || 0} lượt thích</div>
        <div>{currentPost.commentCount || 0} bình luận</div>
      </div>

      {/* Actions */}
      <div className="p-3 flex gap-2 text-gray-600 border-t">
        <button
          onClick={handleToggleLike}
          className={`flex-1 py-2 rounded-lg transition flex items-center justify-center gap-2 ${
            currentPost.isLiked
              ? "bg-blue-100 text-blue-600 font-semibold"
              : "hover:bg-gray-100"
          }`}
        >
          <span>👍</span>
          {currentPost.isLiked ? "Bỏ thích" : "Thích"}
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
      <div className="border-t">
        <CommentSection
          postId={postId}
          onCommentAdded={() => {
            dispatch(getPost(postId));
          }}
        />
      </div>
    </div>
  );
};

export default PostDetail;

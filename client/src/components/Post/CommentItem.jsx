import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  updateComment,
  deleteComment,
  toggleLike,
} from "../../store/slices/commentSlice";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

const CommentItem = ({ comment, postId }) => {
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.user?.profile);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment?.content || "");
  const [showReplies, setShowReplies] = useState(false);

  const isAuthor = currentUser?.userId === comment?.author?._id;

  const handleUpdateComment = async () => {
    if (!editContent.trim()) {
      alert("Nội dung bình luận không được để trống");
      return;
    }

    dispatch(
      updateComment({ commentId: comment._id, content: editContent }),
    ).then(() => {
      setIsEditing(false);
    });
  };

  const handleDeleteComment = () => {
    if (window.confirm("Bạn có chắc muốn xóa bình luận này?")) {
      dispatch(deleteComment(comment._id));
    }
  };

  const handleToggleLike = () => {
    dispatch(toggleLike(comment._id));
  };

  return (
    <div className="flex gap-3 py-3 border-b border-gray-100 last:border-b-0">
      {/* Avatar */}
      <img
        src={comment?.author?.avatar || "/default-avatar.png"}
        alt={comment?.author?.fullName}
        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
      />

      {/* Comment Content */}
      <div className="flex-1">
        {/* Author & Time */}
        <div className="flex items-center gap-2 mb-1">
          <strong className="text-sm text-gray-900">
            {comment?.author?.fullName}
          </strong>
          <span className="text-xs text-gray-500">
            {formatDistanceToNow(new Date(comment?.createdAt), {
              addSuffix: true,
              locale: vi,
            })}
          </span>
        </div>

        {/* Comment Text */}
        {isEditing ? (
          <div className="mb-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
              rows={2}
              maxLength={1000}
            />
            <div className="flex justify-between items-center mt-2 gap-2">
              <span className="text-xs text-gray-500">
                {editContent.length}/1000
              </span>
              <div className="flex gap-2">
                <button
                  onClick={handleUpdateComment}
                  className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                >
                  Lưu
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(comment?.content);
                  }}
                  className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-xs hover:bg-gray-400"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-800 mb-2">{comment?.content}</p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 text-xs">
          <button
            onClick={handleToggleLike}
            className={`transition ${
              comment?.isLiked
                ? "text-blue-500 font-medium"
                : "text-gray-500 hover:text-blue-500"
            }`}
          >
            👍 {comment?.likes?.length || 0}
          </button>

          <button className="text-gray-500 hover:text-blue-500 transition">
            💬 Phản hồi
          </button>

          {isAuthor && (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="text-gray-500 hover:text-blue-500 transition"
              >
                ✎ Sửa
              </button>
              <button
                onClick={handleDeleteComment}
                className="text-gray-500 hover:text-red-500 transition"
              >
                🗑️ Xóa
              </button>
            </>
          )}
        </div>

        {/* Replies Count */}
        {comment?.replyCount > 0 && (
          <button
            onClick={() => setShowReplies(!showReplies)}
            className="text-xs text-blue-500 hover:text-blue-600 mt-2"
          >
            {showReplies ? "Ẩn" : "Xem"} {comment?.replyCount} phản hồi
          </button>
        )}
      </div>
    </div>
  );
};

export default CommentItem;

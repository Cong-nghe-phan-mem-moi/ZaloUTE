import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  createComment,
  getPostComments,
  clearMessage,
  clearError,
} from "../../store/slices/commentSlice";
import CommentItem from "./CommentItem";
import LoadingSpinner from "../common/LoadingSpinner";
import ErrorMessage from "../common/ErrorMessage";
import Toast from "../common/Toast";

const CommentSection = ({ postId, onCommentAdded }) => {
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.user?.profile);
  const { comments, loading, error, message, pagination } = useSelector(
    (state) => state.comments,
  );
  const [content, setContent] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    dispatch(getPostComments({ postId, page, limit: 20 }));
  }, [postId, page, dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!content.trim()) {
      alert("Please enter a comment.");
      return;
    }

    if (content.length > 1000) {
      alert("Comments cannot exceed 1000 characters.");
      return;
    }

    dispatch(createComment({ postId, content })).then(() => {
      setContent("");
      onCommentAdded?.();
    });
  };

  if (!currentUser) {
    return (
      <div className="bg-white rounded-lg p-4 text-center text-gray-500">
        <p>Please log in to comment.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      {/* Messages */}
      {error && (
        <ErrorMessage message={error} onClose={() => dispatch(clearError())} />
      )}
      {message && (
        <Toast
          message={message}
          type="success"
          onClose={() => dispatch(clearMessage())}
        />
      )}

      {/* Comment Form */}
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="flex gap-3">
          <img
            src={currentUser?.avatar || "/default-avatar.png"}
            alt={currentUser?.fullName}
            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
          />
          <div className="flex-1">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write a comment..."
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={2}
              maxLength={1000}
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-gray-500">
                {content.length}/1000
              </span>
              <button
                type="submit"
                disabled={!content.trim() || loading}
                className="px-4 py-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-lg font-medium transition text-sm disabled:cursor-not-allowed"
              >
                {loading ? "Sending..." : "Comment"}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-4">
        {loading && comments.length === 0 && <LoadingSpinner />}

        {comments.length === 0 && !loading && (
          <p className="text-center text-gray-500 py-4">
            No comments yet
          </p>
        )}

        {comments.map((comment) => (
          <CommentItem key={comment._id} comment={comment} postId={postId} />
        ))}

        {/* Load more */}
        {pagination?.totalPages > page && (
          <button
            onClick={() => setPage((p) => p + 1)}
            className="w-full py-2 text-blue-500 hover:text-blue-600 font-medium transition text-sm"
          >
            Load more comments
          </button>
        )}
      </div>
    </div>
  );
};

export default CommentSection;

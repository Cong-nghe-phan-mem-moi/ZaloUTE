import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  updateComment,
  deleteComment,
  toggleLike,
} from "../../redux/slices/commentSlice";
import { commentAPI } from "../../services/comment.service";
import { formatDistanceToNow } from "date-fns";
import { enUS } from "date-fns/locale";
import ReportModal from "../report/ReportModal";

const MAX_COMMENT_LENGTH = 1000;

const getLikeCount = (comment) => {
  if (Array.isArray(comment?.likes)) return comment.likes.length;
  return comment?.likes?.length || 0;
};

const CommentItem = ({
  comment,
  postId,
  focusedCommentId = null,
  focusedParentCommentId = null,
  onReplyAdded,
  depth = 0,
}) => {
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.user?.profile);
  const itemRef = useRef(null);
  const autoOpenedRepliesRef = useRef(false);
  const commentId = comment?._id;
  const currentUserId = currentUser?.userId || currentUser?._id || currentUser?.id;
  const isAuthor = String(currentUserId) === String(comment?.author?._id);
  const isFocused = String(focusedCommentId || "") === String(commentId || "");
  const shouldOpenReplies =
    focusedParentCommentId &&
    String(focusedParentCommentId) === String(commentId);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment?.content || "");
  const [showReplies, setShowReplies] = useState(Boolean(shouldOpenReplies));
  const [replies, setReplies] = useState([]);
  const [replyCount, setReplyCount] = useState(comment?.replyCount || 0);
  const [replyContent, setReplyContent] = useState("");
  const [replyOpen, setReplyOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [repliesLoading, setRepliesLoading] = useState(false);
  const [replySubmitting, setReplySubmitting] = useState(false);

  const loadReplies = async () => {
    if (!commentId || repliesLoading) return;

    setRepliesLoading(true);

    try {
      const response = await commentAPI.getCommentReplies(commentId, 1, 20);
      setReplies(response.data?.data?.replies || []);
    } catch (error) {
      console.error("Unable to load replies:", error);
    } finally {
      setRepliesLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setReplyCount(comment?.replyCount || 0);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [comment?.replyCount]);

  useEffect(() => {
    if (!isFocused) return undefined;

    const timer = window.setTimeout(() => {
      itemRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 150);

    return () => window.clearTimeout(timer);
  }, [isFocused]);

  useEffect(() => {
    if (!shouldOpenReplies || replies.length > 0 || autoOpenedRepliesRef.current) {
      return undefined;
    }

    autoOpenedRepliesRef.current = true;

    const timer = window.setTimeout(async () => {
      setShowReplies(true);
      if (!commentId || repliesLoading) return;

      setRepliesLoading(true);

      try {
        const response = await commentAPI.getCommentReplies(commentId, 1, 20);
        setReplies(response.data?.data?.replies || []);
      } catch (error) {
        console.error("Unable to load replies:", error);
      } finally {
        setRepliesLoading(false);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [commentId, replies.length, repliesLoading, shouldOpenReplies]);

  const handleToggleReplies = async () => {
    const nextShowReplies = !showReplies;
    setShowReplies(nextShowReplies);

    if (nextShowReplies && replies.length === 0) {
      await loadReplies();
    }
  };

  const handleUpdateComment = async () => {
    if (!editContent.trim()) {
      alert("Comment content cannot be empty.");
      return;
    }

    dispatch(
      updateComment({ commentId: comment._id, content: editContent }),
    ).then(() => {
      setIsEditing(false);
    });
  };

  const handleDeleteComment = () => {
    if (window.confirm("Are you sure you want to delete this comment?")) {
      dispatch(deleteComment(comment._id));
    }
  };

  const handleToggleLike = () => {
    dispatch(toggleLike(comment._id));
  };

  const handleSubmitReply = async (event) => {
    event.preventDefault();

    const value = replyContent.trim();
    if (!value) {
      alert("Reply content cannot be empty.");
      return;
    }

    if (value.length > MAX_COMMENT_LENGTH) {
      alert("Replies cannot exceed 1000 characters.");
      return;
    }

    setReplySubmitting(true);

    try {
      const response = await commentAPI.createComment(postId, value, comment._id);
      const newReply = response.data?.data;

      if (newReply) {
        setReplies((items) => [...items, newReply]);
      }

      setReplyContent("");
      setReplyOpen(false);
      setShowReplies(true);
      setReplyCount((count) => count + 1);
      onReplyAdded?.();
    } catch (error) {
      alert(error.response?.data?.message || "Unable to reply.");
    } finally {
      setReplySubmitting(false);
    }
  };

  const avatarClass = depth > 0 ? "h-8 w-8" : "w-10 h-10";
  const containerClass =
    depth > 0
      ? "flex gap-2 py-2"
      : "flex gap-3 py-3 border-b border-gray-100 last:border-b-0";

  return (
    <div
      ref={itemRef}
      className={`${containerClass} ${
        isFocused ? "rounded-lg bg-blue-50 px-2 ring-2 ring-blue-200" : ""
      }`}
    >
      <img
        src={comment?.author?.avatar || "/default-avatar.svg"}
        alt={comment?.author?.fullName}
        className={`${avatarClass} rounded-full object-cover flex-shrink-0`}
      />

      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <strong className="text-sm text-gray-900">
            {comment?.author?.fullName}
          </strong>
          <span className="text-xs text-gray-500">
            {formatDistanceToNow(new Date(comment?.createdAt), {
              addSuffix: true,
              locale: enUS,
            })}
          </span>
        </div>

        {isEditing ? (
          <div className="mb-2">
            <textarea
              value={editContent}
              onChange={(event) => setEditContent(event.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
              rows={2}
              maxLength={MAX_COMMENT_LENGTH}
            />
            <div className="flex justify-between items-center mt-2 gap-2">
              <span className="text-xs text-gray-500">
                {editContent.length}/{MAX_COMMENT_LENGTH}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleUpdateComment}
                  className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(comment?.content);
                  }}
                  className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-xs hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-800 mb-2">{comment?.content}</p>
        )}

        <div className="flex items-center gap-3 text-xs">
          <button
            type="button"
            onClick={handleToggleLike}
            className={`transition ${
              comment?.isLiked
                ? "text-blue-500 font-medium"
                : "text-gray-500 hover:text-blue-500"
            }`}
          >
            Like {getLikeCount(comment)}
          </button>

          <button
            type="button"
            onClick={() => setReplyOpen((open) => !open)}
            className="text-gray-500 hover:text-blue-500 transition"
          >
            Reply
          </button>

          {isAuthor && (
            <>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="text-gray-500 hover:text-blue-500 transition"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={handleDeleteComment}
                className="text-gray-500 hover:text-red-500 transition"
              >
                Delete
              </button>
            </>
          )}

          {!isAuthor ? (
            <button
              type="button"
              onClick={() => setReportOpen(true)}
              className="text-gray-500 hover:text-red-500 transition"
            >
              Report
            </button>
          ) : null}
        </div>

        {replyOpen ? (
          <form onSubmit={handleSubmitReply} className="mt-3 flex gap-2">
            <img
              src={currentUser?.avatar || "/default-avatar.svg"}
              alt={currentUser?.fullName}
              className="h-8 w-8 flex-shrink-0 rounded-full object-cover"
            />
            <div className="flex-1">
              <textarea
                value={replyContent}
                onChange={(event) => setReplyContent(event.target.value)}
                placeholder={`Reply to ${comment?.author?.fullName || "comment"}...`}
                className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                maxLength={MAX_COMMENT_LENGTH}
              />
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  {replyContent.length}/{MAX_COMMENT_LENGTH}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setReplyOpen(false);
                      setReplyContent("");
                    }}
                    className="rounded px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!replyContent.trim() || replySubmitting}
                    className="rounded bg-blue-500 px-3 py-1 text-xs font-medium text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-gray-300"
                  >
                    {replySubmitting ? "Replying..." : "Reply"}
                  </button>
                </div>
              </div>
            </div>
          </form>
        ) : null}

        {replyCount > 0 ? (
          <button
            type="button"
            onClick={handleToggleReplies}
            className="text-xs text-blue-500 hover:text-blue-600 mt-2"
          >
            {showReplies ? "Hide" : "View"} {replyCount} replies
          </button>
        ) : null}

        {showReplies ? (
          <div
            className={`mt-3 space-y-3 border-l-2 border-gray-100 ${
              depth >= 3 ? "pl-2" : "pl-4"
            }`}
          >
            {repliesLoading ? (
              <p className="text-xs text-gray-500">Loading replies...</p>
            ) : null}

            {!repliesLoading &&
              replies.map((reply) => (
                <CommentItem
                  key={reply._id}
                  comment={reply}
                  postId={postId}
                  focusedCommentId={focusedCommentId}
                  focusedParentCommentId={focusedParentCommentId}
                  onReplyAdded={onReplyAdded}
                  depth={depth + 1}
                />
              ))}
          </div>
        ) : null}
      </div>

      <ReportModal
        target={reportOpen ? { type: "Comment", id: commentId } : null}
        onClose={() => setReportOpen(false)}
        onSubmitted={() => window.alert("Report submitted.")}
      />
    </div>
  );
};

export default CommentItem;

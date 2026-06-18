import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { sharePost } from "../../redux/slices/postSlice";

const SharePostModal = ({ post, isOpen, onClose }) => {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.posts);
  const [caption, setCaption] = useState("");
  const [target, setTarget] = useState("timeline");
  const [conversationId, setConversationId] = useState("");

  if (!isOpen || !post) {
    return null;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (target === "message" && !conversationId.trim()) {
      return;
    }

    const result = await dispatch(
      sharePost({
        postId: post._id,
        caption,
        target,
        conversationId: target === "message" ? conversationId.trim() : null,
      }),
    );

    if (!result.error) {
      setCaption("");
      setTarget("timeline");
      setConversationId("");
      onClose?.();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4 py-5"
      role="dialog"
      aria-modal="true"
      onMouseDown={onClose}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg rounded-lg bg-white shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-lg font-semibold text-gray-900">Share post</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
            aria-label="Close share dialog"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        <div className="space-y-4 p-4">
          <textarea
            value={caption}
            onChange={(event) => setCaption(event.target.value)}
            maxLength={1000}
            rows={3}
            placeholder="Write a caption..."
            className="w-full resize-none rounded-lg border border-gray-300 p-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />

          <div className="grid grid-cols-2 gap-2">
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm hover:bg-gray-50">
              <input
                type="radio"
                name="shareTarget"
                value="timeline"
                checked={target === "timeline"}
                onChange={() => setTarget("timeline")}
              />
              Share to profile
            </label>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm hover:bg-gray-50">
              <input
                type="radio"
                name="shareTarget"
                value="message"
                checked={target === "message"}
                onChange={() => setTarget("message")}
              />
              Send in message
            </label>
          </div>

          {target === "message" ? (
            <input
              type="text"
              value={conversationId}
              onChange={(event) => setConversationId(event.target.value)}
              placeholder="Conversation ID"
              className="w-full rounded-lg border border-gray-300 p-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              required
            />
          ) : null}

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Preview
            </p>
            <p className="line-clamp-3 text-sm text-gray-700">
              {post.content || post.sharedFrom?.content || "Media post"}
            </p>
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </div>

        <div className="flex justify-end gap-2 border-t px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || (target === "message" && !conversationId.trim())}
            className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600 disabled:bg-gray-300"
          >
            {loading ? "Sharing..." : "Share"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SharePostModal;

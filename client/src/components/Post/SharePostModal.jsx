import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import UserAvatar from "../common/UserAvatar";
import { chatAPI } from "../../services/chat.service";
import { sharePost } from "../../redux/slices/postSlice";

const getConversationName = (conversation, profile) => {
  if (conversation.isGroup) {
    return conversation.name || "Group chat";
  }

  const myId = String(profile?.id || profile?.userId || "");
  const partner = conversation.participants?.find(
    (participant) => String(participant._id || participant.id) !== myId,
  );

  return partner?.fullName || "Conversation";
};

const getConversationAvatar = (conversation, profile) => {
  if (conversation.isGroup) {
    return conversation.avatar;
  }

  const myId = String(profile?.id || profile?.userId || "");
  const partner = conversation.participants?.find(
    (participant) => String(participant._id || participant.id) !== myId,
  );

  return partner?.avatar;
};

const SharePostModal = ({ post, isOpen, onClose }) => {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.posts);
  const { profile } = useSelector((state) => state.user);
  const [caption, setCaption] = useState("");
  const [target, setTarget] = useState("message");
  const [selectedConversationIds, setSelectedConversationIds] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [query, setQuery] = useState("");
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [conversationError, setConversationError] = useState("");

  useEffect(() => {
    if (!isOpen) return undefined;

    let active = true;
    const loadTimer = window.setTimeout(() => {
      setLoadingConversations(true);
      setConversationError("");

      chatAPI
        .getConversations()
        .then((response) => {
          if (!active) return;
          setConversations(response.data?.data || []);
        })
        .catch((loadError) => {
          if (!active) return;
          setConversationError(
            loadError.response?.data?.message || "Unable to load conversations",
          );
        })
        .finally(() => {
          if (active) {
            setLoadingConversations(false);
          }
        });
    }, 0);

    return () => {
      active = false;
      window.clearTimeout(loadTimer);
    };
  }, [isOpen]);

  const filteredConversations = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return conversations;
    }

    return conversations.filter((conversation) =>
      getConversationName(conversation, profile)
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [conversations, profile, query]);

  if (!isOpen || !post) {
    return null;
  }

  const toggleConversation = (conversationId) => {
    setSelectedConversationIds((ids) =>
      ids.includes(conversationId)
        ? ids.filter((id) => id !== conversationId)
        : [...ids, conversationId],
    );
  };

  const resetAndClose = () => {
    setCaption("");
    setTarget("message");
    setSelectedConversationIds([]);
    setQuery("");
    onClose?.();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (target === "message" && selectedConversationIds.length === 0) {
      return;
    }

    const shareRequests =
      target === "message"
        ? selectedConversationIds.map((conversationId) =>
            dispatch(
              sharePost({
                postId: post._id,
                caption,
                target,
                conversationId,
              }),
            ),
          )
        : [
            dispatch(
              sharePost({
                postId: post._id,
                caption,
                target,
              }),
            ),
          ];

    const results = await Promise.all(shareRequests);
    const hasError = results.some((result) => result.error);

    if (!hasError) {
      resetAndClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4 py-5"
      role="dialog"
      aria-modal="true"
      onMouseDown={resetAndClose}
    >
      <form
        onSubmit={handleSubmit}
        className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-lg bg-white shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-lg font-semibold text-gray-900">Share post</h2>
          <button
            type="button"
            onClick={resetAndClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
            aria-label="Close share dialog"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
          <div className="grid grid-cols-2 rounded-lg bg-gray-100 p-1 text-sm font-semibold text-gray-600">
            <button
              type="button"
              onClick={() => setTarget("message")}
              className={`rounded-md px-3 py-2 ${
                target === "message" ? "bg-white text-blue-600 shadow-sm" : ""
              }`}
            >
              Send in message
            </button>
            <button
              type="button"
              onClick={() => setTarget("timeline")}
              className={`rounded-md px-3 py-2 ${
                target === "timeline" ? "bg-white text-blue-600 shadow-sm" : ""
              }`}
            >
              Share to profile
            </button>
          </div>

          <textarea
            value={caption}
            onChange={(event) => setCaption(event.target.value)}
            maxLength={1000}
            rows={3}
            placeholder={
              target === "message" ? "Say something about this post..." : "Write a caption..."
            }
            className="w-full resize-none rounded-lg border border-gray-300 p-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />

          {target === "message" ? (
            <div className="space-y-3">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-gray-400">
                  search
                </span>
                <input
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search conversations"
                  className="w-full rounded-full border border-gray-300 py-2 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-200">
                {loadingConversations ? (
                  <p className="p-4 text-center text-sm text-gray-500">
                    Loading conversations...
                  </p>
                ) : conversationError ? (
                  <p className="p-4 text-center text-sm text-red-600">
                    {conversationError}
                  </p>
                ) : filteredConversations.length === 0 ? (
                  <p className="p-4 text-center text-sm text-gray-500">
                    No conversations found.
                  </p>
                ) : (
                  filteredConversations.map((conversation) => {
                    const isSelected = selectedConversationIds.includes(
                      conversation._id,
                    );

                    return (
                      <button
                        key={conversation._id}
                        type="button"
                        onClick={() => toggleConversation(conversation._id)}
                        className="flex w-full items-center gap-3 border-b border-gray-100 px-3 py-2 text-left last:border-b-0 hover:bg-gray-50"
                      >
                        <UserAvatar
                          image={getConversationAvatar(conversation, profile)}
                          name={getConversationName(conversation, profile)}
                          size="sm"
                        />
                        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-900">
                          {getConversationName(conversation, profile)}
                        </span>
                        <span
                          className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                            isSelected
                              ? "border-blue-500 bg-blue-500 text-white"
                              : "border-gray-300"
                          }`}
                        >
                          {isSelected ? (
                            <span className="material-symbols-outlined text-[14px]">
                              check
                            </span>
                          ) : null}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
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
            onClick={resetAndClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={
              loading ||
              loadingConversations ||
              (target === "message" && selectedConversationIds.length === 0)
            }
            className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600 disabled:bg-gray-300"
          >
            {loading
              ? "Sending..."
              : target === "message"
                ? `Send${
                    selectedConversationIds.length > 0
                      ? ` (${selectedConversationIds.length})`
                      : ""
                  }`
                : "Share"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SharePostModal;

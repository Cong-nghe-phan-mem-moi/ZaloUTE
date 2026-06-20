import { Link } from "react-router-dom";
import { UserAvatar } from "../../common";

const notificationLinks = {
  friend_request: "/friend-requests",
  friend_accept: "/friends",
  post_like: "/",
  post_comment: "/",
  post_share: "/",
  comment_reply: "/",
  comment_like: "/",
  story_reaction: "/",
  mention: "/messages",
  new_message: "/messages",
};

const popupTitles = {
  friend_request: "New friend request",
  friend_accept: "Friend request accepted",
  post_like: "New like",
  post_comment: "New comment",
  post_share: "New share",
  comment_reply: "New reply",
  comment_like: "New comment like",
  story_reaction: "New story reaction",
  mention: "Mention",
  new_message: "New message",
};

const isFriendAcceptNotification = (notification) =>
  notification.type === "friend_accept" ||
  notification.content === "accepted your friend request";

const getNotificationHref = (notification) => {
  const data = notification.data || {};

  if (notification.type === "mention") {
    const conversationId = data.conversationId || notification.relatedId;
    return conversationId ? `/messages?conversationId=${conversationId}` : "/messages";
  }

  if (notification.type === "new_message") {
    const conversationId = data.conversationId || notification.relatedId;
    return conversationId ? `/messages?conversationId=${conversationId}` : "/messages";
  }

  if (notification.type === "friend_request") {
    const userId = data.profileId || notification.sender?._id;
    return userId ? `/users/profile/${userId}` : "/friend-requests";
  }

  if (isFriendAcceptNotification(notification)) {
    const userId = data.profileId || notification.sender?._id || notification.relatedId;
    return userId ? `/users/profile/${userId}` : "/friends";
  }

  if (["post_like", "post_share"].includes(notification.type)) {
    const postId = data.postId || data.sharedPostId || notification.relatedId;
    return postId ? `/?postId=${encodeURIComponent(postId)}` : "/";
  }

  if (["post_comment", "comment_reply", "comment_like"].includes(notification.type)) {
    const postId =
      data.postId ||
      (notification.relatedType === "Post" ? notification.relatedId : null);
    const commentId =
      data.commentId ||
      (notification.relatedType === "Comment" ? notification.relatedId : null);
    const parentCommentId = data.parentCommentId;

    if (!postId) return "/";

    const params = new URLSearchParams({ postId: String(postId) });
    if (commentId) params.set("commentId", String(commentId));
    if (parentCommentId) params.set("parentCommentId", String(parentCommentId));

    return `/?${params.toString()}`;
  }

  if (notification.type === "story_reaction") {
    const storyId = data.storyId || notification.relatedId;
    return storyId ? `/?storyId=${encodeURIComponent(storyId)}` : "/";
  }

  return notificationLinks[notification.type] || "/";
};

export const NotificationPopup = ({ notification, onClose }) => {
  const senderName = notification.sender?.fullName || "Someone";
  const title = isFriendAcceptNotification(notification)
    ? "Friend request accepted"
    : popupTitles[notification.type] || "New notification";
  const href = getNotificationHref(notification);

  return (
    <div className="fixed right-5 top-24 z-[60] w-[min(360px,calc(100vw-32px))] rounded-lg border border-[#dbe4f0] bg-white p-4 shadow-2xl">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <UserAvatar
            image={notification.sender?.avatar}
            name={senderName}
            size="sm"
          />
          <div className="min-w-0">
            <p className="text-sm font-bold text-[#111827]">{title}</p>
            <p className="truncate text-xs text-[#6b7280]">{senderName}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-1 text-[#6b7280] hover:bg-[#f2f3f5]"
          aria-label="Close notification popup"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>

      <Link to={href} className="block rounded-md hover:bg-[#f8fafc]">
        <p className="text-sm text-[#111827]">
          <span className="font-semibold">{senderName}</span>{" "}
          {notification.content || "sent you a notification"}
        </p>
        {notification.preview ? (
          <p className="mt-2 line-clamp-2 rounded-md bg-[#f2f3f5] px-3 py-2 text-sm text-[#4b5563]">
            "{notification.preview}"
          </p>
        ) : null}
      </Link>
    </div>
  );
};

export const NotificationsDropdown = ({
  notifications,
  unreadCount,
  loading,
  onDeleteNotification,
  onMarkAllAsRead,
  onNotificationClick,
}) => (
  <div className="absolute right-0 top-12 z-50 w-[min(380px,calc(100vw-24px))] rounded-lg border border-[#dddfe2] bg-white p-3 shadow-2xl">
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-lg font-bold text-[#111827]">Notifications</h2>
      {unreadCount > 0 ? (
        <button
          type="button"
          onClick={onMarkAllAsRead}
          className="text-xs font-semibold text-[#1877f2] hover:underline"
        >
          Mark all read
        </button>
      ) : null}
    </div>

    {loading ? (
      <div className="flex items-center gap-3 rounded-md p-3 text-sm text-[#6b7280]">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#1877f2] border-t-transparent" />
        Loading notifications...
      </div>
    ) : null}

    {!loading && notifications.length === 0 ? (
      <div className="rounded-md bg-[#f2f3f5] p-4 text-center text-sm font-semibold text-[#6b7280]">
        No notifications yet.
      </div>
    ) : null}

    {!loading && notifications.length > 0 ? (
      <div className="max-h-[420px] space-y-1 overflow-y-auto">
        {notifications.map((notification) => (
          <NotificationItem
            key={notification._id}
            notification={notification}
            onDelete={onDeleteNotification}
            onClick={onNotificationClick}
          />
        ))}
      </div>
    ) : null}
  </div>
);

const NotificationItem = ({ notification, onClick, onDelete }) => {
  const senderName = notification.sender?.fullName || "Someone";
  const href = getNotificationHref(notification);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick?.(notification, href)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick?.(notification, href);
        }
      }}
      className={`flex cursor-pointer gap-3 rounded-md p-2 hover:bg-[#f2f3f5] ${
        notification.isRead ? "" : "bg-[#eef5ff]"
      }`}
    >
      <UserAvatar
        image={notification.sender?.avatar}
        name={senderName}
        size="sm"
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm text-[#111827]">
          <span className="font-bold">{senderName}</span>{" "}
          {notification.content || "sent you a notification"}
        </p>
        {notification.preview ? (
          <p className="mt-1 line-clamp-2 text-xs text-[#4b5563]">
            "{notification.preview}"
          </p>
        ) : null}
        <p className="mt-1 text-xs text-[#6b7280]">
          {new Date(notification.createdAt).toLocaleString()}
        </p>
      </div>
      <div className="flex shrink-0 items-start gap-2">
        {!notification.isRead ? (
          <span className="mt-2 h-2 w-2 rounded-full bg-[#1877f2]" />
        ) : null}
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onDelete?.(notification);
          }}
          className="flex h-7 w-7 items-center justify-center rounded-full text-[#6b7280] hover:bg-white hover:text-red-600"
          title="Delete notification"
          aria-label="Delete notification"
        >
          <span className="material-symbols-outlined text-[17px]">delete</span>
        </button>
      </div>
    </div>
  );
};

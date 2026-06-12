import { useCallback, useEffect, useRef, useState } from "react";
import { notificationAPI, userAPI } from "../../services/api";
import { useAppDispatch } from "../../store/hooks";
import { clearProfile } from "../../store/slices/userSlice";
import HomeAvatar from "./HomeAvatar";

const HomeHeader = ({ profile, activePage = "home" }) => {
  const dispatch = useAppDispatch();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [newNotificationCount, setNewNotificationCount] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [popupNotification, setPopupNotification] = useState(null);
  const notificationsRef = useRef(null);
  const profileMenuRef = useRef(null);
  const notificationsOpenRef = useRef(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    try {
      await userAPI.logout();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      localStorage.removeItem("token");
      dispatch(clearProfile());
      window.location.assign("/login");
    }
  };

  const loadNotifications = useCallback(async () => {
    setNotificationsLoading(true);

    try {
      const response = await notificationAPI.getNotifications(1, 10);
      setNotifications(response.data?.data?.notifications || []);
      setUnreadCount(response.data?.data?.unreadCount || 0);
    } catch (error) {
      console.error("Unable to load notifications:", error);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setNotificationsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadNotifications();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadNotifications]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return undefined;

    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const wsUrl = `${protocol}://${window.location.host}/api/notifications/ws?token=${encodeURIComponent(token)}`;
    let socket = null;
    let reconnectTimer = null;
    let shouldReconnect = true;

    const handleMessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "notification" && data.notification) {
          setNotifications((items) => {
            const exists = items.some(
              (item) => item._id === data.notification._id,
            );

            if (exists) return items;
            return [data.notification, ...items].slice(0, 10);
          });
          setUnreadCount(data.unreadCount || 0);
          if (!notificationsOpenRef.current) {
            setNewNotificationCount((count) => count + 1);
          }
          setPopupNotification(data.notification);
        }

        if (data.type === "unread_count") {
          setUnreadCount(data.unreadCount || 0);
        }
      } catch (error) {
        console.error("Invalid notification message:", error);
      }
    };

    const connect = () => {
      socket = new WebSocket(wsUrl);
      socket.onopen = () => {
        loadNotifications();
      };
      socket.onmessage = handleMessage;
      socket.onerror = (error) => {
        console.error("Notification websocket error:", error);
      };
      socket.onclose = () => {
        if (!shouldReconnect) return;

        reconnectTimer = window.setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      shouldReconnect = false;
      if (reconnectTimer) {
        window.clearTimeout(reconnectTimer);
      }
      socket?.close();
    };
  }, [loadNotifications]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        loadNotifications();
      }
    }, 15000);

    return () => window.clearInterval(interval);
  }, [loadNotifications]);

  useEffect(() => {
    if (!popupNotification) return undefined;

    const timer = window.setTimeout(() => {
      setPopupNotification(null);
    }, 6000);

    return () => window.clearTimeout(timer);
  }, [popupNotification]);

  useEffect(() => {
    notificationsOpenRef.current = notificationsOpen;
  }, [notificationsOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target)
      ) {
        setNotificationsOpen(false);
      }

      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target)
      ) {
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggleNotifications = async () => {
    const nextOpen = !notificationsOpen;
    setNotificationsOpen(nextOpen);

    if (nextOpen) {
      setNewNotificationCount(0);
      await loadNotifications();
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications((items) =>
        items.map((item) => ({ ...item, isRead: true })),
      );
      setUnreadCount(0);
      setNewNotificationCount(0);
    } catch (error) {
      console.error("Unable to mark notifications as read:", error);
    }
  };

  const handleNotificationClick = async (notification, href) => {
    if (notification.isRead) {
      window.location.assign(href);
      return;
    }

    try {
      await notificationAPI.markAsRead(notification._id);
      setNotifications((items) =>
        items.map((item) =>
          item._id === notification._id ? { ...item, isRead: true } : item,
        ),
      );
      setUnreadCount((count) => Math.max(0, count - 1));
    } catch (error) {
      console.error("Unable to mark notification as read:", error);
    } finally {
      window.location.assign(href);
    }
  };

  return (
    <header className="flex h-20 items-center justify-between gap-4 bg-white px-6 lg:px-12">
      <div className="flex items-center gap-5">
        <a
          href="/"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1877f2] text-xl font-bold text-white"
          aria-label="ZaloUTE home"
        >
          z
        </a>
        <SearchBox />
      </div>

      <nav className="hidden flex-1 items-center justify-center gap-8 text-[#6b7280] md:flex">
        <HeaderTab icon="home" active={activePage === "home"} />
        <HeaderTab icon="storefront" />
        <HeaderTab icon="smart_display" />
        <HeaderTab
          icon="groups"
          href="/friends"
          active={activePage === "friends"}
        />
      </nav>

      <div className="flex items-center gap-3">
        <CircleIcon icon="forum" label="Messages" />
        <div className="relative" ref={notificationsRef}>
          <CircleIcon
            icon="notifications"
            label="Notifications"
            onClick={handleToggleNotifications}
            badge={newNotificationCount}
          />
          {notificationsOpen ? (
            <NotificationsDropdown
              notifications={notifications}
              unreadCount={unreadCount}
              loading={notificationsLoading}
              onMarkAllAsRead={handleMarkAllAsRead}
              onNotificationClick={handleNotificationClick}
            />
          ) : null}
        </div>
        <div className="relative" ref={profileMenuRef}>
          <button
            type="button"
            onClick={() => setProfileMenuOpen((open) => !open)}
            className="flex items-center gap-2 rounded-full px-1 py-1 hover:bg-[#f2f3f5]"
            aria-expanded={profileMenuOpen}
            aria-label="Open profile menu"
          >
            <HomeAvatar
              image={profile?.avatar}
              name={profile?.fullName}
              size="sm"
            />
            <span className="hidden max-w-36 truncate text-sm font-semibold text-[#111827] sm:block">
              {profile?.fullName || "Hexa Pentania"}
            </span>
            <span className="material-symbols-outlined text-[18px] text-[#111827]">
              expand_more
            </span>
          </button>

          {profileMenuOpen ? (
            <ProfileMenu
              profile={profile}
              isLoggingOut={isLoggingOut}
              onLogout={handleLogout}
            />
          ) : null}
        </div>
      </div>
      {popupNotification ? (
        <NotificationPopup
          notification={popupNotification}
          onClose={() => setPopupNotification(null)}
        />
      ) : null}
    </header>
  );
};

const ProfileMenu = ({ profile, isLoggingOut, onLogout }) => (
  <div className="absolute right-0 top-12 z-50 w-72 rounded-lg border border-[#dddfe2] bg-white p-2 shadow-2xl">
    <a
      href="/user/profile"
      className="flex items-center gap-3 rounded-lg p-3 text-[#111827] hover:bg-[#f2f3f5]"
    >
      <HomeAvatar image={profile?.avatar} name={profile?.fullName} size="sm" />
      <div className="min-w-0">
        <p className="truncate text-sm font-bold">
          {profile?.fullName || "Hexa Pentania"}
        </p>
        <p className="text-xs text-[#6b7280]">View your profile</p>
      </div>
    </a>

    <div className="my-1 h-px bg-[#e5e7eb]" />

    <button
      type="button"
      onClick={onLogout}
      disabled={isLoggingOut}
      className="flex w-full items-center gap-3 rounded-lg p-3 text-left text-sm font-semibold text-[#111827] hover:bg-[#f2f3f5] disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f1f3f5]">
        <span className="material-symbols-outlined text-[20px]">logout</span>
      </span>
      {isLoggingOut ? "Logging out..." : "Log out"}
    </button>
  </div>
);

const SearchBox = () => {
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const value = keyword.trim();

    if (value.length < 2) {
      return;
    }

    let isCurrent = true;

    const timer = window.setTimeout(async () => {
      try {
        const response = await userAPI.searchUsers(value, 1, 8);
        if (!isCurrent) return;
        setResults(response.data?.data || []);
      } catch (err) {
        if (!isCurrent) return;
        setResults([]);
        setError(err.response?.data?.message || "Unable to search users.");
      } finally {
        if (isCurrent) {
          setLoading(false);
          setIsOpen(true);
        }
      }
    }, 300);

    return () => {
      isCurrent = false;
      window.clearTimeout(timer);
    };
  }, [keyword]);

  const shouldShowDropdown = isOpen && keyword.trim().length >= 2;

  return (
    <div className="relative hidden md:block" ref={searchRef}>
      <div className="flex h-10 items-center gap-2 rounded-full bg-white text-[#6b7280]">
        <span className="material-symbols-outlined text-[20px]">search</span>
        <input
          className="w-44 border-0 bg-transparent text-sm outline-none placeholder:text-[#9ca3af]"
          placeholder="Search ..."
          type="text"
          value={keyword}
          onChange={(event) => {
            const nextKeyword = event.target.value;
            setKeyword(nextKeyword);
            setIsOpen(true);

            if (nextKeyword.trim().length < 2) {
              setResults([]);
              setError("");
              setLoading(false);
            } else {
              setLoading(true);
              setError("");
            }
          }}
          onFocus={() => setIsOpen(true)}
        />
      </div>

      {shouldShowDropdown ? (
        <div className="absolute left-0 top-12 z-50 w-[min(360px,calc(100vw-24px))] rounded-lg border border-[#dddfe2] bg-white p-2 shadow-2xl">
          <div className="px-2 py-2 text-sm font-semibold text-[#65676b]">
            Search results
          </div>

          {loading ? (
            <div className="flex items-center gap-3 px-2 py-3 text-[#65676b]">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#1877f2] border-t-transparent" />
              <span className="text-sm">Searching...</span>
            </div>
          ) : null}

          {!loading && error ? (
            <p className="px-2 py-3 text-sm text-red-600">{error}</p>
          ) : null}

          {!loading && !error && results.length === 0 ? (
            <p className="px-2 py-3 text-sm text-[#65676b]">
              No matching users found.
            </p>
          ) : null}

          {!loading && !error
            ? results.map((user) => <SearchResultItem key={user.id} user={user} />)
            : null}
        </div>
      ) : null}
    </div>
  );
};

const SearchResultItem = ({ user }) => (
  <a
    href={`/users/profile/${user.id}`}
    className="flex items-center gap-3 rounded-lg p-2 text-[#050505] hover:bg-[#f0f2f5]"
  >
    <HomeAvatar image={user.avatar} name={user.fullName} size="sm" />
    <div className="min-w-0">
      <p className="truncate text-[15px] font-semibold">{user.fullName}</p>
      <p className="text-xs text-[#65676b]">
        {user.relation === "friend"
          ? "Friend"
          : user.relation === "sent_request"
            ? "Request sent"
            : user.relation === "received_request"
              ? "Respond to request"
              : "View profile"}
      </p>
    </div>
  </a>
);

const HeaderTab = ({ icon, active = false, href = "/" }) => (
  <a
    href={href}
    className={`flex h-14 w-20 items-center justify-center border-b-4 ${
      active
        ? "border-[#1877f2] text-[#1877f2]"
        : "border-transparent hover:text-[#1877f2]"
    }`}
  >
    <span className="material-symbols-outlined text-[24px]">{icon}</span>
  </a>
);

const CircleIcon = ({ icon, label, onClick, disabled = false, badge = 0 }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={label}
    aria-label={label}
    className="relative flex h-9 w-9 items-center justify-center rounded-full bg-[#f1f3f5] text-[#111827] hover:bg-[#e5e7eb] disabled:cursor-not-allowed disabled:opacity-60"
  >
    <span className="material-symbols-outlined text-[20px]">{icon}</span>
    {badge > 0 ? (
      <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-red-500 px-1 text-center text-[10px] font-bold leading-5 text-white">
        {badge > 9 ? "9+" : badge}
      </span>
    ) : null}
  </button>
);

const notificationLinks = {
  friend_request: "/friend-requests",
  post_like: "/",
  post_comment: "/",
  comment_reply: "/",
  comment_like: "/",
};

const popupTitles = {
  friend_request: "New friend request",
  post_like: "New like",
  post_comment: "New comment",
  comment_reply: "New reply",
  comment_like: "New comment like",
};

const NotificationPopup = ({ notification, onClose }) => {
  const senderName = notification.sender?.fullName || "Someone";
  const title = popupTitles[notification.type] || "New notification";
  const href = notificationLinks[notification.type] || "/";

  return (
    <div className="fixed right-5 top-24 z-[60] w-[min(360px,calc(100vw-32px))] rounded-lg border border-[#dbe4f0] bg-white p-4 shadow-2xl">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <HomeAvatar
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

      <a href={href} className="block rounded-md hover:bg-[#f8fafc]">
        <p className="text-sm text-[#111827]">
          <span className="font-semibold">{senderName}</span>{" "}
          {notification.content || "sent you a notification"}
        </p>
        {notification.preview ? (
          <p className="mt-2 line-clamp-2 rounded-md bg-[#f2f3f5] px-3 py-2 text-sm text-[#4b5563]">
            "{notification.preview}"
          </p>
        ) : null}
      </a>
    </div>
  );
};

const NotificationsDropdown = ({
  notifications,
  unreadCount,
  loading,
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
            onClick={onNotificationClick}
          />
        ))}
      </div>
    ) : null}
  </div>
);

const NotificationItem = ({ notification, onClick }) => {
  const senderName = notification.sender?.fullName || "Someone";
  const href = notificationLinks[notification.type] || "/";

  return (
    <a
      href={href}
      onClick={(event) => {
        event.preventDefault();
        onClick?.(notification, href);
      }}
      className={`flex gap-3 rounded-md p-2 hover:bg-[#f2f3f5] ${
        notification.isRead ? "" : "bg-[#eef5ff]"
      }`}
    >
      <HomeAvatar
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
      {!notification.isRead ? (
        <span className="mt-2 h-2 w-2 rounded-full bg-[#1877f2]" />
      ) : null}
    </a>
  );
};

export default HomeHeader;


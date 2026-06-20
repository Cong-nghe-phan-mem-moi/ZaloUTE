import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useClickOutside, useLogout } from "../../hooks";
import { notificationAPI } from "../../services/notification.service";
import { AppLogo, IconButton, UserAvatar, UserSearchBox } from "../common";
import {
  NotificationPopup,
  NotificationsDropdown,
} from "./header/Notifications";
import ProfileMenu from "./header/ProfileMenu";

const getNotificationWsUrl = (token) => {
  const encodedToken = encodeURIComponent(token);
  const isSecure = window.location.protocol === "https:";

  if (import.meta.env.DEV) {
    const apiOrigin =
      import.meta.env.VITE_API_ORIGIN ||
      `${window.location.protocol}//${window.location.hostname}:5000`;
    const wsOrigin = apiOrigin.replace(/^http/, isSecure ? "wss" : "ws");

    return `${wsOrigin}/api/notifications/ws?token=${encodedToken}`;
  }

  const protocol = isSecure ? "wss" : "ws";
  return `${protocol}://${window.location.host}/api/notifications/ws?token=${encodedToken}`;
};

const LAST_SEEN_NOTIFICATION_KEY = "lastSeenNotificationAt";

const getLastSeenNotificationAt = () => {
  const value = localStorage.getItem(LAST_SEEN_NOTIFICATION_KEY);
  const timestamp = value ? Number(value) : 0;

  return Number.isFinite(timestamp) ? timestamp : 0;
};

const getNotificationTime = (notification) =>
  new Date(notification?.createdAt || 0).getTime();

const getNewNotificationCount = (notifications) => {
  const lastSeenAt = getLastSeenNotificationAt();

  return notifications.filter(
    (notification) => getNotificationTime(notification) > lastSeenAt,
  ).length;
};

const rememberNotificationsSeen = (notifications) => {
  const latestTimestamp = notifications.reduce(
    (latest, notification) =>
      Math.max(latest, getNotificationTime(notification)),
    Date.now(),
  );

  localStorage.setItem(
    LAST_SEEN_NOTIFICATION_KEY,
    String(latestTimestamp || Date.now()),
  );
};

const HomeHeader = ({ profile, activePage = "home" }) => {
  const navigate = useNavigate();
  const { isLoggingOut, logout: handleLogout } = useLogout();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [newNotificationCount, setNewNotificationCount] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [popupNotification, setPopupNotification] = useState(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const notificationsRef = useRef(null);
  const profileMenuRef = useRef(null);
  const notificationsOpenRef = useRef(false);

  const closeNotifications = useCallback(() => setNotificationsOpen(false), []);
  const closeProfileMenu = useCallback(() => setProfileMenuOpen(false), []);

  useClickOutside(notificationsRef, closeNotifications);
  useClickOutside(profileMenuRef, closeProfileMenu);

  const loadNotifications = useCallback(async () => {
    setNotificationsLoading(true);

    try {
      const response = await notificationAPI.getNotifications(1, 10);
      const nextNotifications = response.data?.data?.notifications || [];
      setNotifications(nextNotifications);
      setNewNotificationCount(getNewNotificationCount(nextNotifications));
      setUnreadCount(response.data?.data?.unreadCount || 0);
      return nextNotifications;
    } catch (error) {
      console.error("Unable to load notifications:", error);
      setNotifications([]);
      setNewNotificationCount(0);
      setUnreadCount(0);
      return [];
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

    const wsUrl = getNotificationWsUrl(token);
    let socket = null;
    let reconnectTimer = null;
    let shouldReconnect = true;
    let hasConnected = false;

    const handleMessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "notification" && data.notification) {
          setNotifications((items) => {
            const exists = items.some(
              (item) => item._id === data.notification._id,
            );

            if (exists) return items;
            const nextItems = [data.notification, ...items].slice(0, 10);
            if (notificationsOpenRef.current) {
              rememberNotificationsSeen(nextItems);
              setNewNotificationCount(0);
            } else {
              setNewNotificationCount(getNewNotificationCount(nextItems));
            }
            return nextItems;
          });
          setUnreadCount(data.unreadCount || 0);
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
        hasConnected = true;
        loadNotifications();
      };
      socket.onmessage = handleMessage;
      socket.onerror = (error) => {
        if (hasConnected) {
          console.error("Notification websocket error:", error);
        }
      };
      socket.onclose = (event) => {
        if (event.code === 1008 || !hasConnected) {
          shouldReconnect = false;
          return;
        }

        if (!shouldReconnect) return;

        reconnectTimer = window.setTimeout(connect, 3000);
      };
    };

    notificationAPI
      .getNotifications(1, 1)
      .then(() => {
        if (shouldReconnect) {
          connect();
        }
      })
      .catch((error) => {
        shouldReconnect = false;
        console.error("Unable to start notification websocket:", error);
      });

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

  const handleToggleNotifications = async () => {
    const nextOpen = !notificationsOpen;
    setNotificationsOpen(nextOpen);

    if (nextOpen) {
      const nextNotifications = await loadNotifications();
      rememberNotificationsSeen(nextNotifications);
      setNewNotificationCount(0);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications((items) =>
        items.map((item) => ({ ...item, isRead: true })),
      );
      setUnreadCount(0);
    } catch (error) {
      console.error("Unable to mark notifications as read:", error);
    }
  };

  const handleNotificationClick = async (notification, href) => {
    if (notification.isRead) {
      navigate(href);
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
      navigate(href);
    }
  };

  return (
    <header className="flex h-20 items-center justify-between gap-4 bg-white px-6 lg:px-12">
      <div className="flex items-center gap-5">
        <AppLogo />
        <UserSearchBox />
      </div>

      <nav className="hidden flex-1 items-center justify-center gap-8 text-[#6b7280] md:flex">
        <HeaderTab icon="home" active={activePage === "home"} />
        <HeaderTab icon="storefront" />
        <HeaderTab icon="smart_display" />
        <HeaderTab
          icon="groups"
          href="/groups"
          active={activePage === "groups"}
        />
      </nav>

      <div className="flex items-center gap-3">
        <IconButton
          icon="forum"
          label="Messages"
          onClick={() => window.location.assign("/messages")}
        />
        <div className="relative" ref={notificationsRef}>
          <IconButton
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
            <UserAvatar
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

const HeaderTab = ({ icon, active = false, href = "/" }) => (
  <Link
    to={href}
    className={`flex h-14 w-20 items-center justify-center border-b-4 ${
      active
        ? "border-[#1877f2] text-[#1877f2]"
        : "border-transparent hover:text-[#1877f2]"
    }`}
  >
    <span className="material-symbols-outlined text-[24px]">{icon}</span>
  </Link>
);

export default HomeHeader;


import { useCallback, useEffect, useRef, useState } from "react";
import { notificationAPI } from "../../services/notification.service";

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

export const useHeaderNotifications = (navigate) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [newNotificationCount, setNewNotificationCount] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [popupNotification, setPopupNotification] = useState(null);
  const notificationsOpenRef = useRef(false);

  const closeNotifications = useCallback(() => {
    setNotificationsOpen(false);
  }, []);

  const loadNotifications = useCallback(async () => {
    setNotificationsLoading(true);

    try {
      const response = await notificationAPI.getNotifications(1, 10);
      const nextNotifications = response.data?.data?.notifications || [];
      setNotifications(nextNotifications);
      setUnreadCount(response.data?.data?.unreadCount || 0);
      setNewNotificationCount(response.data?.data?.newNotificationCount || 0);
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
            setNewNotificationCount(data.newNotificationCount || 0);
            return nextItems;
          });
          setUnreadCount(data.unreadCount || 0);
          setPopupNotification(data.notification);

          if (notificationsOpenRef.current) {
            notificationAPI.markAsSeen().catch((error) => {
              console.error("Unable to mark notifications as seen:", error);
            });
          }
        }

        if (data.type === "unread_count") {
          setUnreadCount(data.unreadCount || 0);
        }

        if (
          data.type === "new_notification_count" ||
          data.type === "notification_seen"
        ) {
          setNewNotificationCount(data.newNotificationCount || 0);
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
      await loadNotifications();

      try {
        const response = await notificationAPI.markAsSeen();
        setNewNotificationCount(response.data?.data?.newNotificationCount || 0);
      } catch (error) {
        console.error("Unable to mark notifications as seen:", error);
      }
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

  return {
    notifications,
    unreadCount,
    newNotificationCount,
    notificationsOpen,
    notificationsLoading,
    popupNotification,
    closeNotifications,
    handleMarkAllAsRead,
    handleNotificationClick,
    handleToggleNotifications,
    setPopupNotification,
  };
};

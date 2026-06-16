const Notification = require("../models/notification.model");
const jwt = require("jsonwebtoken");
const { WebSocketServer, WebSocket } = require("ws");

const getId = (value) => value?._id || value?.id || value;
const clients = new Map();
const PREVIEW_WORD_LIMIT = 18;

const buildPreview = (text) => {
  if (!text || typeof text !== "string") return null;

  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= PREVIEW_WORD_LIMIT) {
    return words.join(" ");
  }

  return `${words.slice(0, PREVIEW_WORD_LIMIT).join(" ")}...`;
};

const onlineTracker = require("../utils/onlineTracker");

const sendToUser = (userId, payload) => {
  const userClients = clients.get(userId.toString());
  if (!userClients) return;

  const message = JSON.stringify(payload);
  userClients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
      return;
    }

    userClients.delete(client);
  });
};

// Register notification sendToUser helper with onlineTracker
onlineTracker.setNotificationSendHelper(sendToUser);

const addClient = (userId, socket) => {
  const key = userId.toString();
  const userClients = clients.get(key) || new Set();
  userClients.add(socket);
  clients.set(key, userClients);

  // Notify online tracker that a connection has been established
  onlineTracker.handleConnectionChange(userId, true, "notification");

  socket.on("close", () => {
    const currentClients = clients.get(key);
    if (!currentClients) return;

    currentClients.delete(socket);
    if (currentClients.size === 0) {
      clients.delete(key);
    }
    // Notify online tracker that a connection has been closed
    onlineTracker.handleConnectionChange(userId, false, "notification");
  });
};

class NotificationService {
  static async createNotification({
    receiver,
    sender,
    type,
    content,
    preview,
    relatedId = null,
    relatedType = null,
    data = {},
  }) {
    const receiverId = getId(receiver);
    const senderId = getId(sender);

    if (!receiverId) {
      console.warn("Notification skipped: missing receiver", {
        receiver,
        sender,
        type,
      });
      return null;
    }

    if (senderId && receiverId.toString() === senderId.toString()) {
      console.warn("Notification skipped: sender and receiver are the same", {
        receiverId: receiverId.toString(),
        senderId: senderId.toString(),
        type,
      });
      return null;
    }

    console.log("Creating notification:", {
      receiverId: receiverId.toString(),
      senderId: senderId?.toString?.() || null,
      type,
      content,
      relatedId: relatedId?.toString?.() || relatedId || null,
      relatedType,
    });

    const notification = await Notification.create({
      receiver: receiverId,
      sender: senderId,
      type,
      content,
      preview: buildPreview(preview),
      relatedId,
      relatedType,
      data,
    });

    const [populatedNotification, unreadCount] = await Promise.all([
      Notification.findById(notification._id).populate("sender", "fullName avatar"),
      Notification.countDocuments({ receiver: receiverId, isRead: false }),
    ]);

    sendToUser(receiverId, {
      type: "notification",
      notification: populatedNotification,
      unreadCount,
    });

    return populatedNotification;
  }

  static async getNotifications(userId, page = 1, limit = 20) {
    if (page < 1) page = 1;
    if (limit < 1 || limit > 50) limit = 20;

    const skip = (page - 1) * limit;
    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find({ receiver: userId })
        .populate("sender", "fullName avatar")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Notification.countDocuments({ receiver: userId }),
      Notification.countDocuments({ receiver: userId, isRead: false }),
    ]);

    return {
      notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async markAsRead(notificationId, userId) {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, receiver: userId },
      { isRead: true },
      { new: true },
    );

    if (notification) {
      const unreadCount = await Notification.countDocuments({
        receiver: userId,
        isRead: false,
      });
      sendToUser(userId, { type: "unread_count", unreadCount });
    }

    return notification;
  }

  static async markAllAsRead(userId) {
    await Notification.updateMany(
      { receiver: userId, isRead: false },
      { isRead: true },
    );
    sendToUser(userId, { type: "unread_count", unreadCount: 0 });
  }

  static attachWebSocketServer(server) {
    const wss = new WebSocketServer({ noServer: true });
    const closeUnauthorized = (request, socket, head, reason = "Unauthorized") => {
      console.warn(`Notification websocket rejected: ${reason}`);
      wss.handleUpgrade(request, socket, head, (ws) => {
        ws.close(1008, reason);
      });
    };

    server.on("upgrade", (request, socket, head) => {
      const url = new URL(request.url, `http://${request.headers.host}`);
      if (url.pathname !== "/api/notifications/ws") {
        return;
      }

      const token = url.searchParams.get("token");
      if (!token) {
        closeUnauthorized(request, socket, head, "Missing token");
        return;
      }

      let user;
      try {
        user = jwt.verify(token, process.env.JWT_SECRET);
      } catch (error) {
        closeUnauthorized(request, socket, head, error.message || "Invalid token");
        return;
      }

      if (!user?.userId) {
        closeUnauthorized(request, socket, head, "Missing user id");
        return;
      }

      wss.handleUpgrade(request, socket, head, (ws) => {
        ws.userId = user.userId;
        addClient(user.userId, ws);
        ws.send(JSON.stringify({ type: "connected" }));
        Notification.countDocuments({
          receiver: user.userId,
          isRead: false,
        })
          .then((unreadCount) => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: "unread_count", unreadCount }));
            }
          })
          .catch((error) => {
            console.error("Unable to send unread count:", error);
          });
      });
    });
  }
}

module.exports = NotificationService;

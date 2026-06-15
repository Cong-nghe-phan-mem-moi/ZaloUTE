const chatRepository = require("../repo/chat.repository");
const UserRepository = require("../repo/user.repository");
const jwt = require("jsonwebtoken");
const { WebSocketServer, WebSocket } = require("ws");

const clients = new Map(); // Map: userId (string) -> Set of WebSocket clients

const throwError = (statusCode, code, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  throw error;
};

// Gửi payload dạng JSON tới người dùng cụ thể
const sendToUser = (userId, payload) => {
  const userClients = clients.get(userId.toString());
  if (!userClients) return;

  const messageStr = JSON.stringify(payload);
  userClients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(messageStr);
    } else {
      userClients.delete(client);
    }
  });

  if (userClients.size === 0) {
    clients.delete(userId.toString());
  }
};

const addClient = (userId, socket) => {
  const key = userId.toString();
  const userClients = clients.get(key) || new Set();
  userClients.add(socket);
  clients.set(key, userClients);

  socket.on("close", () => {
    const currentClients = clients.get(key);
    if (!currentClients) return;
    currentClients.delete(socket);
    if (currentClients.size === 0) {
      clients.delete(key);
    }
  });
};

class ChatService {
  static async getUserConversations(userId) {
    const conversations = await chatRepository.getConversationsByUserId(userId);
    return {
      success: true,
      data: conversations,
    };
  }

  static async getOrCreateDirectConversation(userId, targetUserId) {
    if (userId.toString() === targetUserId.toString()) {
      throwError(400, "INVALID_TARGET", "Cannot chat with yourself");
    }

    // Kiểm tra xem targetUser có tồn tại không
    const targetUser = await UserRepository.findById(targetUserId);
    if (!targetUser) {
      throwError(404, "USER_NOT_FOUND", "Target user not found");
    }

    let conversation = await chatRepository.findDirectConversation(userId, targetUserId);
    
    if (!conversation) {
      conversation = await chatRepository.createConversation({
        isGroup: false,
        participants: [userId, targetUserId],
      });
    }

    // Lấy thông tin chi tiết cuộc trò chuyện đầy đủ
    const populated = await chatRepository.getConversationById(conversation._id);
    return {
      success: true,
      data: populated,
    };
  }

  static async getConversationMessages(conversationId, userId, page = 1, limit = 50) {
    const conversation = await chatRepository.getConversationById(conversationId);
    if (!conversation) {
      throwError(404, "CONVERSATION_NOT_FOUND", "Conversation not found");
    }

    // Kiểm tra xem user có nằm trong cuộc trò chuyện này không
    const isParticipant = conversation.participants.some(
      (p) => p._id.toString() === userId.toString()
    );
    if (!isParticipant) {
      throwError(403, "FORBIDDEN", "You are not a participant in this conversation");
    }

    const skip = (page - 1) * limit;
    const messages = await chatRepository.getMessagesByConversationId(conversationId, skip, limit);
    
    // Đảo ngược lại để sắp xếp tin nhắn theo thứ tự thời gian tăng dần trước khi gửi về client
    const chronologicalMessages = messages.reverse();

    return {
      success: true,
      data: chronologicalMessages,
    };
  }

  static attachWebSocketServer(server) {
    const wss = new WebSocketServer({ noServer: true });
    
    const closeUnauthorized = (request, socket, head, reason = "Unauthorized") => {
      console.warn(`Chat websocket rejected: ${reason}`);
      wss.handleUpgrade(request, socket, head, (ws) => {
        ws.close(1008, reason);
      });
    };

    server.on("upgrade", (request, socket, head) => {
      const url = new URL(request.url, `http://${request.headers.host}`);
      if (url.pathname !== "/api/chats/ws") {
        return; // Nhường cho listener khác xử lý (ví dụ: notification ws)
      }

      const token = url.searchParams.get("token");
      if (!token) {
        closeUnauthorized(request, socket, head, "Missing token");
        return;
      }

      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch (error) {
        closeUnauthorized(request, socket, head, error.message || "Invalid token");
        return;
      }

      if (!decoded?.userId) {
        closeUnauthorized(request, socket, head, "Missing user id");
        return;
      }

      wss.handleUpgrade(request, socket, head, (ws) => {
        ws.userId = decoded.userId;
        addClient(decoded.userId, ws);
        
        ws.send(JSON.stringify({ type: "connected" }));

        // Lắng nghe các sự kiện nhận được từ client qua WebSocket
        ws.on("message", async (rawMessage) => {
          try {
            const payload = JSON.parse(rawMessage);
            const { type, conversationId } = payload;

            if (!conversationId) return;

            // Kiểm tra xem cuộc hội thoại có tồn tại và người dùng có phải thành viên không
            const conversation = await chatRepository.getConversationById(conversationId);
            if (!conversation) return;

            const isParticipant = conversation.participants.some(
              (p) => p._id.toString() === ws.userId.toString()
            );
            if (!isParticipant) return;

            if (type === "send_message") {
              const { content, messageType } = payload;
              if (!content || String(content).trim() === "") return;

              // 1. Lưu tin nhắn vào CSDL
              const savedMessage = await chatRepository.saveMessage({
                conversationId,
                senderId: ws.userId,
                content: content.trim(),
                messageType: messageType || "text",
                readBy: [ws.userId]
              });

              // 2. Cập nhật tin nhắn cuối trong cuộc hội thoại
              await chatRepository.updateConversationLastMessage(conversationId, savedMessage._id);

              // Lấy thông tin hội thoại cập nhật để gửi cho các client cập nhật sidebar
              const updatedConversation = await chatRepository.getConversationsByUserId(ws.userId);
              const conversationForThisId = updatedConversation.find(
                (c) => c._id.toString() === conversationId.toString()
              );

              // 3. Truyền tải tin nhắn mới đến tất cả người dùng trong phòng chat
              conversation.participants.forEach((participant) => {
                const participantIdStr = participant._id.toString();
                // Gửi tin nhắn mới
                sendToUser(participantIdStr, {
                  type: "message",
                  data: savedMessage,
                });

                // Gửi hội thoại được cập nhật để cập nhật danh sách hội thoại của họ
                sendToUser(participantIdStr, {
                  type: "conversation_update",
                  data: conversationForThisId || conversation,
                });
              });

            } else if (type === "typing") {
              const { isTyping } = payload;
              // Gửi trạng thái đang gõ tới tất cả các thành viên khác trong phòng chat
              conversation.participants.forEach((participant) => {
                const participantIdStr = participant._id.toString();
                if (participantIdStr !== ws.userId.toString()) {
                  sendToUser(participantIdStr, {
                    type: "typing",
                    conversationId,
                    userId: ws.userId,
                    isTyping: !!isTyping,
                  });
                }
              });

            } else if (type === "read_receipt") {
              // Cập nhật CSDL đánh dấu đã đọc
              await chatRepository.markMessagesAsRead(conversationId, ws.userId);
              
              // Gửi trạng thái đã đọc tới các thành viên khác
              conversation.participants.forEach((participant) => {
                const participantIdStr = participant._id.toString();
                if (participantIdStr !== ws.userId.toString()) {
                  sendToUser(participantIdStr, {
                    type: "read_receipt",
                    conversationId,
                    userId: ws.userId,
                  });
                }
              });
            }

          } catch (error) {
            console.error("Error processing websocket message:", error);
          }
        });

      });
    });
  }
}

module.exports = ChatService;

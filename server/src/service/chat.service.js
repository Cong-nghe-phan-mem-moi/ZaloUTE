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

  static async createGroup(creatorId, name, participantIds) {
    if (!name || name.trim() === "") {
      throwError(400, "MISSING_NAME", "Tên nhóm không được để trống");
    }

    if (!Array.isArray(participantIds)) {
      throwError(400, "INVALID_PARTICIPANTS", "Danh sách thành viên không hợp lệ");
    }

    // Đảm bảo có creatorId trong danh sách và loại bỏ trùng lặp
    const uniqueParticipants = Array.from(
      new Set([creatorId.toString(), ...participantIds.map(p => p.toString())])
    );

    if (uniqueParticipants.length < 3) {
      throwError(400, "MIN_MEMBERS", "Một nhóm phải có ít nhất 3 thành viên");
    }

    // Tạo nhóm
    const conversation = await chatRepository.createConversation({
      isGroup: true,
      name: name.trim(),
      participants: uniqueParticipants,
      admin: creatorId,
    });

    const creator = await UserRepository.findById(creatorId);

    // Tạo tin nhắn hệ thống báo tạo nhóm
    const savedMessage = await chatRepository.saveMessage({
      conversationId: conversation._id,
      senderId: creatorId,
      content: `${creator.fullName} đã tạo nhóm "${name.trim()}"`,
      messageType: "system",
      readBy: [creatorId],
    });

    await chatRepository.updateConversationLastMessage(conversation._id, savedMessage._id);

    // Lấy thông tin chi tiết cuộc trò chuyện đầy đủ
    const populated = await chatRepository.getConversationById(conversation._id);

    // Gửi cập nhật qua WS cho tất cả các thành viên
    uniqueParticipants.forEach((pId) => {
      sendToUser(pId, {
        type: "conversation_update",
        data: populated,
      });
      sendToUser(pId, {
        type: "message",
        data: savedMessage,
      });
    });

    return {
      success: true,
      data: populated,
    };
  }

  static async removeGroupMember(adminId, conversationId, targetUserId) {
    const conversation = await chatRepository.getConversationById(conversationId);
    if (!conversation) {
      throwError(404, "CONVERSATION_NOT_FOUND", "Không tìm thấy cuộc trò chuyện");
    }

    if (!conversation.isGroup) {
      throwError(400, "NOT_A_GROUP", "Cuộc trò chuyện này không phải là nhóm");
    }

    if (conversation.admin?._id.toString() !== adminId.toString()) {
      throwError(403, "FORBIDDEN", "Bạn không có quyền xóa thành viên (chỉ trưởng nhóm mới có quyền)");
    }

    const isParticipant = conversation.participants.some(
      (p) => p._id.toString() === targetUserId.toString()
    );
    if (!isParticipant) {
      throwError(400, "NOT_PARTICIPANT", "Người dùng này không thuộc nhóm");
    }

    if (adminId.toString() === targetUserId.toString()) {
      throwError(400, "CANNOT_REMOVE_SELF", "Trưởng nhóm không thể tự xóa mình. Hãy dùng chức năng rời nhóm");
    }

    // Xóa thành viên
    const updatedConv = await chatRepository.removeParticipant(conversationId, targetUserId);

    const adminUser = await UserRepository.findById(adminId);
    const targetUser = await UserRepository.findById(targetUserId);

    // Lưu tin nhắn hệ thống
    const savedMessage = await chatRepository.saveMessage({
      conversationId,
      senderId: adminId,
      content: `${adminUser.fullName} đã xóa ${targetUser.fullName} khỏi nhóm`,
      messageType: "system",
      readBy: [adminId],
    });

    await chatRepository.updateConversationLastMessage(conversationId, savedMessage._id);

    // Lấy lại hội thoại chi tiết sau khi cập nhật lastMessage
    const finalPopulated = await chatRepository.getConversationById(conversationId);

    // Gửi WS đến các thành viên còn lại
    finalPopulated.participants.forEach((p) => {
      const pId = p._id.toString();
      sendToUser(pId, {
        type: "conversation_update",
        data: finalPopulated,
      });
      sendToUser(pId, {
        type: "message",
        data: savedMessage,
      });
    });

    // Gửi WS thông báo xóa hội thoại cho người bị xóa
    sendToUser(targetUserId, {
      type: "conversation_remove",
      conversationId: conversationId,
    });

    return {
      success: true,
      data: finalPopulated,
    };
  }

  static async leaveGroup(userId, conversationId) {
    const conversation = await chatRepository.getConversationById(conversationId);
    if (!conversation) {
      throwError(404, "CONVERSATION_NOT_FOUND", "Không tìm thấy cuộc trò chuyện");
    }

    if (!conversation.isGroup) {
      throwError(400, "NOT_A_GROUP", "Cuộc trò chuyện này không phải là nhóm");
    }

    const isParticipant = conversation.participants.some(
      (p) => p._id.toString() === userId.toString()
    );
    if (!isParticipant) {
      throwError(400, "NOT_PARTICIPANT", "Bạn không thuộc nhóm này");
    }

    // Xóa thành viên khỏi cuộc trò chuyện
    let updatedConv = await chatRepository.removeParticipant(conversationId, userId);

    const leavingUser = await UserRepository.findById(userId);
    let systemMsgContent = `${leavingUser.fullName} đã rời nhóm`;

    // Nếu người rời đi là admin
    if (conversation.admin?._id.toString() === userId.toString()) {
      const remainingParticipants = updatedConv.participants;
      if (remainingParticipants.length > 0) {
        // Chỉ định người tiếp theo làm admin
        const newAdminId = remainingParticipants[0]._id;
        updatedConv = await chatRepository.updateConversationAdmin(conversationId, newAdminId);
        const newAdminUser = await UserRepository.findById(newAdminId);
        systemMsgContent = `${leavingUser.fullName} đã rời nhóm và chuyển quyền trưởng nhóm cho ${newAdminUser.fullName}`;
      }
    }

    // Lưu tin nhắn hệ thống (chỉ cần nếu vẫn còn người trong nhóm)
    let savedMessage = null;
    if (updatedConv.participants.length > 0) {
      savedMessage = await chatRepository.saveMessage({
        conversationId,
        senderId: userId,
        content: systemMsgContent,
        messageType: "system",
        readBy: [userId],
      });
      await chatRepository.updateConversationLastMessage(conversationId, savedMessage._id);
      
      // Lấy thông tin cập nhật cuối cùng
      const finalPopulated = await chatRepository.getConversationById(conversationId);

      // Gửi WS đến các thành viên còn lại
      finalPopulated.participants.forEach((p) => {
        const pId = p._id.toString();
        sendToUser(pId, {
          type: "conversation_update",
          data: finalPopulated,
        });
        sendToUser(pId, {
          type: "message",
          data: savedMessage,
        });
      });
    }

    // Gửi WS thông báo xóa hội thoại cho người rời nhóm
    sendToUser(userId, {
      type: "conversation_remove",
      conversationId: conversationId,
    });

    return {
      success: true,
      message: "Rời nhóm thành công",
    };
  }

  static async addGroupMembers(userId, conversationId, targetUserIds) {
    if (!Array.isArray(targetUserIds) || targetUserIds.length === 0) {
      throwError(400, "INVALID_PARTICIPANTS", "Danh sách thành viên cần thêm không hợp lệ");
    }

    const conversation = await chatRepository.getConversationById(conversationId);
    if (!conversation) {
      throwError(404, "CONVERSATION_NOT_FOUND", "Không tìm thấy cuộc trò chuyện");
    }

    if (!conversation.isGroup) {
      throwError(400, "NOT_A_GROUP", "Cuộc trò chuyện này không phải là nhóm");
    }

    const isParticipant = conversation.participants.some(
      (p) => p._id.toString() === userId.toString()
    );
    if (!isParticipant) {
      throwError(403, "FORBIDDEN", "Bạn không có quyền thêm thành viên vào nhóm này");
    }

    const existingIds = conversation.participants.map(p => p._id.toString());
    const newMembersToAdd = targetUserIds.filter(id => !existingIds.includes(id.toString()));

    if (newMembersToAdd.length === 0) {
      throwError(400, "NO_NEW_MEMBERS", "Tất cả người dùng được chọn đã là thành viên của nhóm");
    }

    // Thêm thành viên
    const updatedConv = await chatRepository.addParticipants(conversationId, newMembersToAdd);

    const adderUser = await UserRepository.findById(userId);
    
    // Lấy tên các thành viên để ghi vào tin nhắn hệ thống
    const addedUsers = await Promise.all(
      newMembersToAdd.map(id => UserRepository.findById(id))
    );
    const addedNames = addedUsers.map(u => u.fullName).join(", ");
    const systemMsgText = `${adderUser.fullName} đã thêm ${addedNames} vào nhóm`;

    // Lưu tin nhắn hệ thống
    const savedMessage = await chatRepository.saveMessage({
      conversationId,
      senderId: userId,
      content: systemMsgText,
      messageType: "system",
      readBy: [userId],
    });

    await chatRepository.updateConversationLastMessage(conversationId, savedMessage._id);

    const finalPopulated = await chatRepository.getConversationById(conversationId);

    // Gửi WebSocket cho tất cả thành viên trong nhóm (bao gồm các thành viên mới)
    finalPopulated.participants.forEach((p) => {
      const pId = p._id.toString();
      sendToUser(pId, {
        type: "conversation_update",
        data: finalPopulated,
      });
      sendToUser(pId, {
        type: "message",
        data: savedMessage,
      });
    });

    return {
      success: true,
      data: finalPopulated,
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
              
              // Lấy thông tin hội thoại mới nhất sau khi đã đánh dấu đọc để gửi về cho chính mình để xóa chấm xanh thông báo
              const updatedConversation = await chatRepository.getConversationsByUserId(ws.userId);
              const conversationForThisId = updatedConversation.find(
                (c) => c._id.toString() === conversationId.toString()
              );
              if (conversationForThisId) {
                sendToUser(ws.userId, {
                  type: "conversation_update",
                  data: conversationForThisId,
                });
              }

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

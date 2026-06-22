const chatRepository = require("../repositories/chat.repository");
const UserRepository = require("../repositories/user.repository");
const Message = require("../models/message.model");
const Conversation = require("../models/conversation.model");
const User = require("../models/user.model");
const jwt = require("jsonwebtoken");
const { WebSocketServer, WebSocket } = require("ws");

const clients = new Map(); // Map: userId (string) -> Set of WebSocket clients

const throwError = (statusCode, code, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  throw error;
};

const onlineTracker = require("../utils/onlineTracker");
const areUsersBlockedForDirectChat = async (userAId, userBId) => {
  const [userA, userB] = await Promise.all([
    User.findById(userAId).select("blockedUsers"),
    User.findById(userBId).select("blockedUsers"),
  ]);

  const userABlocked = (userA?.blockedUsers || []).some(
    (id) => String(id) === String(userBId),
  );
  const userBBlocked = (userB?.blockedUsers || []).some(
    (id) => String(id) === String(userAId),
  );

  return userABlocked || userBBlocked;
};

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

// Register chat sendToUser helper with onlineTracker
onlineTracker.setChatSendHelper(sendToUser);

const addClient = (userId, socket) => {
  const key = userId.toString();
  const userClients = clients.get(key) || new Set();
  userClients.add(socket);
  clients.set(key, userClients);

  // Notify online tracker that a connection has been established
  onlineTracker.handleConnectionChange(userId, true, "chat");

  socket.on("close", () => {
    const currentClients = clients.get(key);
    if (!currentClients) return;
    currentClients.delete(socket);
    if (currentClients.size === 0) {
      clients.delete(key);
    }
    // Notify online tracker that a connection has been closed
    onlineTracker.handleConnectionChange(userId, false, "chat");
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
    const targetUser = await UserRepository.findById(targetUserId);
    if (!targetUser) {
      throwError(404, "USER_NOT_FOUND", "Target user not found");
    }

    if (await areUsersBlockedForDirectChat(userId, targetUserId)) {
      throwError(403, "DIRECT_CHAT_BLOCKED", "You cannot message this user");
    }

    let conversation = await chatRepository.findDirectConversation(userId, targetUserId);
    
    if (!conversation) {
      conversation = await chatRepository.createConversation({
        isGroup: false,
        participants: [userId, targetUserId],
      });
    }
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
    const isParticipant = conversation.participants.some(
      (p) => p._id.toString() === userId.toString()
    );
    if (!isParticipant) {
      throwError(403, "FORBIDDEN", "You are not a participant in this conversation");
    }

    const skip = (page - 1) * limit;
    const messages = await chatRepository.getMessagesByConversationId(conversationId, skip, limit);
    const chronologicalMessages = messages.reverse();

    return {
      success: true,
      data: chronologicalMessages,
    };
  }

  static async markConversationsAsSeen(userId) {
    const chatSeenAt = new Date();
    await User.findByIdAndUpdate(userId, { chatSeenAt });
    const conversations = await chatRepository.getConversationsByUserId(userId);
    sendToUser(userId, {
      type: "message_badge_seen",
      unreadConversationCount: 0,
      chatSeenAt,
    });

    return {
      success: true,
      data: {
        conversations,
        unreadConversationCount: 0,
        chatSeenAt,
      },
    };
  }

  static countNewConversations(conversations, userId, chatSeenAt) {
    const seenAt = chatSeenAt ? new Date(chatSeenAt).getTime() : 0;
    const currentUserId = userId.toString();

    return (conversations || []).filter((conversation) => {
      const lastMessage = conversation?.lastMessage;
      if (!lastMessage) return false;

      const senderId = (lastMessage.senderId?._id || lastMessage.senderId)?.toString();
      if (senderId === currentUserId) return false;

      const hasRead = (lastMessage.readBy || []).some(
        (reader) => (reader?._id || reader)?.toString() === currentUserId,
      );
      if (hasRead) return false;

      return new Date(lastMessage.createdAt).getTime() > seenAt;
    }).length;
  }

  static async getConversationBadge(userId) {
    const [user, conversations] = await Promise.all([
      User.findById(userId).select("chatSeenAt"),
      chatRepository.getConversationsByUserId(userId),
    ]);

    return {
      success: true,
      data: {
        count: this.countNewConversations(conversations, userId, user?.chatSeenAt),
        chatSeenAt: user?.chatSeenAt || null,
      },
    };
  }

  static async createGroup(creatorId, name, participantIds) {
    if (!name || name.trim() === "") {
      throwError(400, "MISSING_NAME", "Group name cannot be empty");
    }

    if (!Array.isArray(participantIds)) {
      throwError(400, "INVALID_PARTICIPANTS", "Invalid list of members");
    }
    const uniqueParticipants = Array.from(
      new Set([creatorId.toString(), ...participantIds.map(p => p.toString())])
    );

    if (uniqueParticipants.length < 3) {
      throwError(400, "MIN_MEMBERS", "A group must have at least 3 members");
    }
    const conversation = await chatRepository.createConversation({
      isGroup: true,
      name: name.trim(),
      participants: uniqueParticipants,
      admin: creatorId,
    });

    const creator = await UserRepository.findById(creatorId);
    const savedMessage = await chatRepository.saveMessage({
      conversationId: conversation._id,
      senderId: creatorId,
      content: `${creator.fullName} created the group "${name.trim()}"`,
      messageType: "system",
      readBy: [creatorId],
    });

    await chatRepository.updateConversationLastMessage(conversation._id, savedMessage._id);
    const populated = await chatRepository.getConversationById(conversation._id);
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
      throwError(404, "CONVERSATION_NOT_FOUND", "Conversation not found");
    }

    if (!conversation.isGroup) {
      throwError(400, "NOT_A_GROUP", "This conversation is not a group");
    }

    if (conversation.admin?._id.toString() !== adminId.toString()) {
      throwError(403, "FORBIDDEN", "You do not have permission to remove members (only the group creator/admin has this right)");
    }

    const isParticipant = conversation.participants.some(
      (p) => p._id.toString() === targetUserId.toString()
    );
    if (!isParticipant) {
      throwError(400, "NOT_PARTICIPANT", "This user is not a member of the group");
    }

    if (adminId.toString() === targetUserId.toString()) {
      throwError(400, "CANNOT_REMOVE_SELF", "Group admin cannot remove themselves. Please use the leave group feature.");
    }
    const updatedConv = await chatRepository.removeParticipant(conversationId, targetUserId);

    const adminUser = await UserRepository.findById(adminId);
    const targetUser = await UserRepository.findById(targetUserId);
    const savedMessage = await chatRepository.saveMessage({
      conversationId,
      senderId: adminId,
      content: `${adminUser.fullName} removed ${targetUser.fullName} from the group`,
      messageType: "system",
      readBy: [adminId],
    });

    await chatRepository.updateConversationLastMessage(conversationId, savedMessage._id);
    const finalPopulated = await chatRepository.getConversationById(conversationId);
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
      throwError(404, "CONVERSATION_NOT_FOUND", "Conversation not found");
    }

    if (!conversation.isGroup) {
      throwError(400, "NOT_A_GROUP", "This conversation is not a group");
    }

    const isParticipant = conversation.participants.some(
      (p) => p._id.toString() === userId.toString()
    );
    if (!isParticipant) {
      throwError(400, "NOT_PARTICIPANT", "You are not a member of this group");
    }
    let updatedConv = await chatRepository.removeParticipant(conversationId, userId);

    const leavingUser = await UserRepository.findById(userId);
    let systemMsgContent = `${leavingUser.fullName} left the group`;
    if (conversation.admin?._id.toString() === userId.toString()) {
      const remainingParticipants = updatedConv.participants;
      if (remainingParticipants.length > 0) {
        const newAdminId = remainingParticipants[0]._id;
        updatedConv = await chatRepository.updateConversationAdmin(conversationId, newAdminId);
        const newAdminUser = await UserRepository.findById(newAdminId);
        systemMsgContent = `${leavingUser.fullName} left the group and transferred group admin privileges to ${newAdminUser.fullName}`;
      }
    }
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
      const finalPopulated = await chatRepository.getConversationById(conversationId);
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
    sendToUser(userId, {
      type: "conversation_remove",
      conversationId: conversationId,
    });

    return {
      success: true,
      message: "Left group successfully",
    };
  }

  static async addGroupMembers(userId, conversationId, targetUserIds) {
    if (!Array.isArray(targetUserIds) || targetUserIds.length === 0) {
      throwError(400, "INVALID_PARTICIPANTS", "Invalid list of members to add");
    }

    const conversation = await chatRepository.getConversationById(conversationId);
    if (!conversation) {
      throwError(404, "CONVERSATION_NOT_FOUND", "Conversation not found");
    }

    if (!conversation.isGroup) {
      throwError(400, "NOT_A_GROUP", "This conversation is not a group");
    }

    const isParticipant = conversation.participants.some(
      (p) => p._id.toString() === userId.toString()
    );
    if (!isParticipant) {
      throwError(403, "FORBIDDEN", "You do not have permission to add members to this group");
    }

    const existingIds = conversation.participants.map(p => p._id.toString());
    const newMembersToAdd = targetUserIds.filter(id => !existingIds.includes(id.toString()));

    if (newMembersToAdd.length === 0) {
      throwError(400, "NO_NEW_MEMBERS", "All selected users are already members of this group");
    }
    const updatedConv = await chatRepository.addParticipants(conversationId, newMembersToAdd);

    const adderUser = await UserRepository.findById(userId);
    const addedUsers = await Promise.all(
      newMembersToAdd.map(id => UserRepository.findById(id))
    );
    const addedNames = addedUsers.map(u => u.fullName).join(", ");
    const systemMsgText = `${adderUser.fullName} added ${addedNames} to the group`;
    const savedMessage = await chatRepository.saveMessage({
      conversationId,
      senderId: userId,
      content: systemMsgText,
      messageType: "system",
      readBy: [userId],
    });

    await chatRepository.updateConversationLastMessage(conversationId, savedMessage._id);

    const finalPopulated = await chatRepository.getConversationById(conversationId);
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

  static async muteConversation(userId, conversationId, duration) {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      throwError(404, "CONVERSATION_NOT_FOUND", "Conversation not found");
    }

    let untilDate = new Date();
    if (duration === 1) {
      untilDate = new Date(Date.now() + 60 * 60 * 1000);
    } else if (duration === 4) {
      untilDate = new Date(Date.now() + 4 * 60 * 60 * 1000);
    } else if (duration === 8) {
      untilDate.setHours(8, 0, 0, 0);
      if (new Date().getHours() >= 8) {
        untilDate.setDate(untilDate.getDate() + 1);
      }
    } else if (duration === -1) {
      untilDate = new Date("9999-12-31T23:59:59Z");
    } else {
      throwError(400, "INVALID_DURATION", "Invalid notification mute duration");
    }

    const index = conversation.mutedUntil.findIndex(
      (m) => m.user.toString() === userId.toString()
    );
    if (index !== -1) {
      conversation.mutedUntil[index].until = untilDate;
    } else {
      conversation.mutedUntil.push({ user: userId, until: untilDate });
    }

    await conversation.save();

    const populated = await chatRepository.getConversationById(conversationId);
    return { success: true, data: populated };
  }

  static async unmuteConversation(userId, conversationId) {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      throwError(404, "CONVERSATION_NOT_FOUND", "Conversation not found");
    }

    conversation.mutedUntil = conversation.mutedUntil.filter(
      (m) => m.user.toString() !== userId.toString()
    );

    await conversation.save();

    const populated = await chatRepository.getConversationById(conversationId);
    return { success: true, data: populated };
  }

  static async blockConversation(userId, conversationId) {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      throwError(404, "CONVERSATION_NOT_FOUND", "Conversation not found");
    }

    if (!conversation.blockedBy.includes(userId)) {
      conversation.blockedBy.push(userId);
      await conversation.save();
    }

    const populated = await chatRepository.getConversationById(conversationId);
    return { success: true, data: populated };
  }

  static async unblockConversation(userId, conversationId) {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      throwError(404, "CONVERSATION_NOT_FOUND", "Conversation not found");
    }

    conversation.blockedBy = conversation.blockedBy.filter(
      (id) => id.toString() !== userId.toString()
    );
    await conversation.save();

    const populated = await chatRepository.getConversationById(conversationId);
    return { success: true, data: populated };
  }

  static async deleteConversation(userId, conversationId) {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      throwError(404, "CONVERSATION_NOT_FOUND", "Conversation not found");
    }

    conversation.participants = conversation.participants.filter(
      (id) => id.toString() !== userId.toString()
    );

    conversation.mutedUntil = conversation.mutedUntil.filter(
      (m) => m.user.toString() !== userId.toString()
    );
    conversation.blockedBy = conversation.blockedBy.filter(
      (id) => id.toString() !== userId.toString()
    );

    if (conversation.participants.length === 0) {
      await Conversation.findByIdAndDelete(conversationId);
      await Message.deleteMany({ conversationId });
    } else {
      await conversation.save();
    }

    return { success: true, conversationId };
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
        return;
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
        ws.on("message", async (rawMessage) => {
          try {
            const payload = JSON.parse(rawMessage);
            const { type, conversationId } = payload;

            if (!conversationId) return;
            const conversation = await chatRepository.getConversationById(conversationId);
            if (!conversation) return;

            const isParticipant = conversation.participants.some(
              (p) => p._id.toString() === ws.userId.toString()
            );
            if (!isParticipant) return;

            if (type === "send_message") {
              const { content, messageType, replyTo, mentions } = payload;
              if (!content || String(content).trim() === "") return;

              if (!conversation.isGroup) {
                const otherParticipant = conversation.participants.find(
                  (participant) => participant._id.toString() !== ws.userId.toString(),
                );

                if (
                  otherParticipant &&
                  (await areUsersBlockedForDirectChat(ws.userId, otherParticipant._id))
                ) {
                  ws.send(JSON.stringify({
                    type: "error",
                    conversationId,
                    message: "You cannot message this user",
                  }));
                  return;
                }
              }

              // Check blocking
              if (conversation.blockedBy && conversation.blockedBy.length > 0) {
                const isBlockedByOther = conversation.blockedBy.some(
                  (id) => id.toString() !== ws.userId.toString()
                );
                const hasBlockedOther = conversation.blockedBy.some(
                  (id) => id.toString() === ws.userId.toString()
                );

                let errMsg = "The conversation is blocked";
                if (isBlockedByOther) {
                  errMsg = "You have been blocked by this user";
                } else if (hasBlockedOther) {
                  errMsg = "You have blocked this user. Please unblock to continue messaging.";
                }

                ws.send(JSON.stringify({
                  type: "error",
                  conversationId,
                  message: errMsg
                }));
                return;
              }

              let finalMentions = mentions || [];
              if (content.includes("@All") && conversation.isGroup) {
                const allParticipantIds = conversation.participants
                  .map((p) => (p._id || p).toString())
                  .filter((id) => id !== ws.userId.toString());
                finalMentions = Array.from(new Set([...finalMentions, ...allParticipantIds]));
              }
              const savedMessage = await chatRepository.saveMessage({
                conversationId,
                senderId: ws.userId,
                content: content.trim(),
                messageType: messageType || "text",
                readBy: [ws.userId],
                replyTo: replyTo || null,
                mentions: finalMentions,
              });

              // Send mention notifications (exempt from mute filter)
              if (finalMentions.length > 0) {
                const NotificationService = require("./notification.service");
                finalMentions.forEach(async (receiverId) => {
                  if (receiverId.toString() === ws.userId.toString()) return;
                  try {
                    await NotificationService.createNotification({
                      receiver: receiverId,
                      sender: ws.userId,
                      type: "mention",
                      content: `${savedMessage.senderId.fullName} mentioned you in the group ${conversation.name || "chat"}`,
                      preview: content.trim(),
                      relatedId: conversationId,
                      relatedType: null,
                      data: {
                        conversationId,
                        messageId: savedMessage._id,
                      },
                    });
                  } catch (err) {
                    console.error("Error creating mention notification:", err);
                  }
                });
              }
              await chatRepository.updateConversationLastMessage(conversationId, savedMessage._id);
              const updatedConversation = await chatRepository.getConversationsByUserId(ws.userId);
              const conversationForThisId = updatedConversation.find(
                (c) => c._id.toString() === conversationId.toString()
              );
              conversation.participants.forEach((participant) => {
                const participantIdStr = participant._id.toString();
                sendToUser(participantIdStr, {
                  type: "message",
                  data: savedMessage,
                });
                sendToUser(participantIdStr, {
                  type: "conversation_update",
                  data: conversationForThisId || conversation,
                });
              });

            } else if (type === "revoke_message") {
              const { messageId } = payload;
              if (!messageId) return;

              // Find message
              const message = await Message.findById(messageId);
              if (!message) return;

              // Check if the user is the sender
              if (message.senderId.toString() !== ws.userId.toString()) return;

              // Check if message belongs to the conversation
              if (message.conversationId.toString() !== conversationId.toString()) return;

              // Update message in DB to revoke it
              message.isRevoked = true;
              message.content = "Message has been unsent";
              message.messageType = "text";
              await message.save();

              const populatedMessage = await Message.findById(message._id)
                .populate("senderId", "fullName avatar")
                .populate({
                  path: "replyTo",
                  populate: {
                    path: "senderId",
                    select: "fullName avatar",
                  },
                });

              // Fetch updated conversation to send for sidebar updates
              const updatedConversation = await chatRepository.getConversationsByUserId(ws.userId);
              const conversationForThisId = updatedConversation.find(
                (c) => c._id.toString() === conversationId.toString()
              );

              // Broadcast update to all participants
              conversation.participants.forEach((participant) => {
                const participantIdStr = participant._id.toString();
                // Broadcast updated message
                sendToUser(participantIdStr, {
                  type: "message_update",
                  data: populatedMessage,
                });

                // Broadcast updated conversation
                sendToUser(participantIdStr, {
                  type: "conversation_update",
                  data: conversationForThisId || conversation,
                });
              });

            } else if (type === "typing") {
              const { isTyping } = payload;
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
              await chatRepository.markMessagesAsRead(conversationId, ws.userId);
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

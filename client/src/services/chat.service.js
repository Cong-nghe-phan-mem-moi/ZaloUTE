import apiClient from "./apiClient";

export const chatAPI = {
  getConversations: () => apiClient.get("/chats/conversations"),
  getConversationBadge: () => apiClient.get("/chats/conversations/badge"),
  getOrCreateConversation: (targetUserId) =>
    apiClient.post("/chats/conversations", { targetUserId }),
  markConversationsAsSeen: () =>
    apiClient.post("/chats/conversations/seen"),
  getMessages: (conversationId, page = 1, limit = 50) =>
    apiClient.get(`/chats/conversations/${conversationId}/messages`, {
      params: { page, limit },
    }),
  uploadConversationImage: (conversationId, file) => {
    const formData = new FormData();
    formData.append("image", file);
    return apiClient.post(`/chats/conversations/${conversationId}/images`, formData);
  },
  createGroup: (name, participantIds) =>
    apiClient.post("/chats/groups", { name, participantIds }),
  removeGroupMember: (conversationId, memberId) =>
    apiClient.post(`/chats/groups/${conversationId}/remove-member`, { memberId }),
  leaveGroup: (conversationId) =>
    apiClient.post(`/chats/groups/${conversationId}/leave`),
  addGroupMembers: (conversationId, participantIds) =>
    apiClient.post(`/chats/groups/${conversationId}/add-members`, {
      participantIds,
    }),
  muteConversation: (conversationId, duration) =>
    apiClient.post(`/chats/conversations/${conversationId}/mute`, { duration }),
  unmuteConversation: (conversationId) =>
    apiClient.post(`/chats/conversations/${conversationId}/unmute`),
  blockConversation: (conversationId) =>
    apiClient.post(`/chats/conversations/${conversationId}/block`),
  unblockConversation: (conversationId) =>
    apiClient.post(`/chats/conversations/${conversationId}/unblock`),
  deleteConversation: (conversationId) =>
    apiClient.delete(`/chats/conversations/${conversationId}`),
};

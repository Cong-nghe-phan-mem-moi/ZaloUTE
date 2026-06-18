import apiClient from "./apiClient";

export const chatAPI = {
  getConversations: () => apiClient.get("/chats/conversations"),
  getOrCreateConversation: (targetUserId) =>
    apiClient.post("/chats/conversations", { targetUserId }),
  getMessages: (conversationId, page = 1, limit = 50) =>
    apiClient.get(`/chats/conversations/${conversationId}/messages`, {
      params: { page, limit },
    }),
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


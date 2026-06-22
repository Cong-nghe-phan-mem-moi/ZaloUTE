import apiClient from "./apiClient";

export const groupAPI = {
  createGroup: (payload) => apiClient.post("/groups/create", payload),
  getMyGroups: () => apiClient.get("/groups/my-groups"),
  getInvitations: () => apiClient.get("/groups/invitations"),
  getGroupDetail: (groupId) => apiClient.get(`/groups/${groupId}`),
  updateGroupInfo: (groupId, payload) =>
    apiClient.put(`/groups/${groupId}`, payload),
  inviteToGroup: (groupId, invitedUserIds) =>
    apiClient.post(`/groups/${groupId}/invite`, { targetUserIds: invitedUserIds }),
  cancelInvitation: (groupId, targetUserId) =>
    apiClient.post(`/groups/${groupId}/cancel-invite`, { targetUserId }),
  acceptGroupInvitation: (groupId) =>
    apiClient.post(`/groups/${groupId}/accept-invite`),
  rejectGroupInvitation: (groupId) =>
    apiClient.post(`/groups/${groupId}/reject-invite`),
  requestJoinGroup: (groupId) =>
    apiClient.post(`/groups/${groupId}/request`),
  approveJoinRequest: (groupId, targetUserId) =>
    apiClient.post(`/groups/${groupId}/approve`, { targetUserId }),
  assignAdmin: (groupId, targetUserId) =>
    apiClient.post(`/groups/${groupId}/assign-admin`, { targetUserId }),
  removeMember: (groupId, targetUserId) =>
    apiClient.post(`/groups/${groupId}/remove-member`, { targetUserId }),
};

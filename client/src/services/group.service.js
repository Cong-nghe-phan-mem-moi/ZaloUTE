import apiClient from "./apiClient";

const buildGroupFormData = (payload = {}) => {
  const formData = new FormData();

  if (payload.name !== undefined) formData.append("name", payload.name);
  if (payload.description !== undefined) {
    formData.append("description", payload.description);
  }
  if (payload.isPrivate !== undefined) {
    formData.append("isPrivate", String(!!payload.isPrivate));
  }
  if (payload.avatarFile instanceof File) {
    formData.append("avatar", payload.avatarFile);
  }
  if (payload.invitedUserIds !== undefined) {
    formData.append("invitedUserIds", JSON.stringify(payload.invitedUserIds));
  }

  return formData;
};

export const groupAPI = {
  createGroup: (payload) => apiClient.post("/groups/create", buildGroupFormData(payload)),
  getMyGroups: () => apiClient.get("/groups/my-groups"),
  getInvitations: () => apiClient.get("/groups/invitations"),
  getGroupDetail: (groupId) => apiClient.get(`/groups/${groupId}`),
  updateGroupInfo: (groupId, payload) =>
    apiClient.put(`/groups/${groupId}`, buildGroupFormData(payload)),
  deleteGroup: (groupId) => apiClient.delete(`/groups/${groupId}`),
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

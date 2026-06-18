import apiClient from "./apiClient";

export const userAPI = {
  getProfile: () => apiClient.get("/profile"),
  updateProfile: (data) => apiClient.put("/profile", data),
  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append("avatar", file);
    return apiClient.put("/profile/avatar", formData);
  },
  uploadCoverImage: (file) => {
    const formData = new FormData();
    formData.append("coverImage", file);
    return apiClient.put("/profile/cover-image", formData);
  },
  searchUsers: (keyword, page = 1, limit = 8) =>
    apiClient.get("/users/search", {
      params: { keyword, page, limit },
    }),
  getOtherProfile: (id) => apiClient.get(`/users/profile/${id}`),
  sendFriendRequest: (receiverId) =>
    apiClient.post("/users/friend-request", { receiverId }),
  getIncomingFriendRequests: () =>
    apiClient.get("/users/friend-request/incoming"),
  getOutgoingFriendRequests: () =>
    apiClient.get("/users/friend-request/outgoing"),
  acceptFriendRequest: (senderId) =>
    apiClient.put("/users/friend-request/accept", { senderId }),
  rejectFriendRequest: (senderId) =>
    apiClient.put("/users/friend-request/reject", { senderId }),
  cancelFriendRequest: (receiverId) =>
    apiClient.delete("/users/friend-request/cancel", { data: { receiverId } }),
  unfriend: (friendId) =>
    apiClient.delete("/users/friend-request/unfriend", { data: { friendId } }),
  blockUser: (userId) => apiClient.post(`/users/${userId}/block`),
  unblockUser: (userId) => apiClient.post(`/users/${userId}/unblock`),
  getBlockedUsers: () => apiClient.get("/users/blocked"),
  logout: () => apiClient.post("/users/logout"),
};


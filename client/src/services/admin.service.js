import apiClient from "./apiClient";

export const adminAPI = {
  getStats: () => apiClient.get("/admin/stats"),
  getUsers: (params = {}) => apiClient.get("/admin/users", { params }),
  updateUserStatus: (userId, status) =>
    apiClient.put(`/admin/users/${userId}/status`, { status }),
  deleteUser: (userId) => apiClient.delete(`/admin/users/${userId}`),
  getPosts: (params = {}) => apiClient.get("/admin/posts", { params }),
  deletePost: (postId) => apiClient.delete(`/admin/posts/${postId}`),
  getStickers: (params = {}) => apiClient.get("/admin/stickers", { params }),
  createSticker: (data) => apiClient.post("/admin/stickers", data),
  updateSticker: (stickerId, data) =>
    apiClient.put(`/admin/stickers/${stickerId}`, data),
  deleteSticker: (stickerId) => apiClient.delete(`/admin/stickers/${stickerId}`),
};


import apiClient from "./apiClient";

export const adminAPI = {
  getStats: () => apiClient.get("/admin/stats"),
  getUsers: (params = {}) => apiClient.get("/admin/users", { params }),
  getUserDetail: (userId) => apiClient.get(`/admin/users/${userId}/detail`),
  updateUserStatus: (userId, status) =>
    apiClient.put(`/admin/users/${userId}/status`, { status }),
  suspendUser: (userId, data) =>
    apiClient.put(`/admin/users/${userId}/status`, {
      status: "suspended",
      ...data,
    }),
  deleteUser: (userId) => apiClient.delete(`/admin/users/${userId}`),
  getPosts: (params = {}) => apiClient.get("/admin/posts", { params }),
  hidePost: (postId, reason = "") =>
    apiClient.put(`/admin/posts/${postId}/hide`, { reason }),
  deletePost: (postId) => apiClient.delete(`/admin/posts/${postId}`),
  getComments: (params = {}) => apiClient.get("/admin/comments", { params }),
  deleteComment: (commentId) => apiClient.delete(`/admin/comments/${commentId}`),
  getReports: (params = {}) => apiClient.get("/admin/reports", { params }),
  resolveReport: (reportId, data) =>
    apiClient.put(`/admin/reports/${reportId}/resolve`, data),
  getLogs: (params = {}) => apiClient.get("/admin/logs", { params }),
  getStickers: (params = {}) => apiClient.get("/admin/stickers", { params }),
  createSticker: (data) => apiClient.post("/admin/stickers", data),
  updateSticker: (stickerId, data) =>
    apiClient.put(`/admin/stickers/${stickerId}`, data),
  deleteSticker: (stickerId) => apiClient.delete(`/admin/stickers/${stickerId}`),
};

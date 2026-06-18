import apiClient from "./apiClient";

export const notificationAPI = {
  getNotifications: (page = 1, limit = 10) =>
    apiClient.get("/notifications", { params: { page, limit } }),
  markAsRead: (notificationId) =>
    apiClient.put(`/notifications/${notificationId}/read`),
  markAsSeen: () => apiClient.put("/notifications/seen"),
  markAllAsRead: () => apiClient.put("/notifications/read-all"),
  deleteNotification: (notificationId) =>
    apiClient.delete(`/notifications/${notificationId}`),
};

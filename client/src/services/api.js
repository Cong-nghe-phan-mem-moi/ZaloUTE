import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

export const requestPasswordResetOtp = (email) =>
  api.post("/auth/forgot-password/request-otp", { email });

export const verifyPasswordResetOtp = (email, otp) =>
  api.post("/auth/forgot-password/verify-otp", { email, otp });

export const resetPassword = (newPassword, resetToken) =>
  api.post(
    "/auth/forgot-password/reset-password",
    { newPassword, resetToken },
    {
      headers: resetToken
        ? {
            Authorization: `Bearer ${resetToken}`,
          }
        : undefined,
    },
  );

// Add interceptor to include token in every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Don't set Content-Type for FormData - let browser set it automatically
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export const userAPI = {
  getProfile: () => api.get("/profile"),
  updateProfile: (data) => api.put("/profile", data),
  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append("avatar", file);
    return api.put("/profile/avatar", formData);
  },
  uploadCoverImage: (file) => {
    const formData = new FormData();
    formData.append("coverImage", file);
    return api.put("/profile/cover-image", formData);
  },
  searchUsers: (keyword, page = 1, limit = 8) =>
    api.get("/users/search", {
      params: { keyword, page, limit },
    }),
  getOtherProfile: (id) => api.get(`/users/profile/${id}`),
  sendFriendRequest: (receiverId) =>
    api.post("/users/friend-request", { receiverId }),
  getIncomingFriendRequests: () => api.get("/users/friend-request/incoming"),
  getOutgoingFriendRequests: () => api.get("/users/friend-request/outgoing"),
  acceptFriendRequest: (senderId) =>
    api.put("/users/friend-request/accept", { senderId }),
  rejectFriendRequest: (senderId) =>
    api.put("/users/friend-request/reject", { senderId }),
  cancelFriendRequest: (receiverId) =>
    api.delete("/users/friend-request/cancel", { data: { receiverId } }),
  unfriend: (friendId) =>
    api.delete("/users/friend-request/unfriend", { data: { friendId } }),
  logout: () => api.post("/users/logout"),
};

export const notificationAPI = {
  getNotifications: (page = 1, limit = 10) =>
    api.get("/notifications", { params: { page, limit } }),
  markAsRead: (notificationId) =>
    api.put(`/notifications/${notificationId}/read`),
  markAllAsRead: () => api.put("/notifications/read-all"),
};

export const adminAPI = {
  getStats: () => api.get("/admin/stats"),
  getUsers: (params = {}) => api.get("/admin/users", { params }),
  updateUserStatus: (userId, status) =>
    api.put(`/admin/users/${userId}/status`, { status }),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
  getPosts: (params = {}) => api.get("/admin/posts", { params }),
  deletePost: (postId) => api.delete(`/admin/posts/${postId}`),
  getStickers: (params = {}) => api.get("/admin/stickers", { params }),
  createSticker: (data) => api.post("/admin/stickers", data),
  updateSticker: (stickerId, data) =>
    api.put(`/admin/stickers/${stickerId}`, data),
  deleteSticker: (stickerId) => api.delete(`/admin/stickers/${stickerId}`),
};

export const authAPI = {
  login: (credentials) => api.post("/auth/login", credentials),
};

export const registerAPI = {
  register: (fullName, email, password) =>
    api.post("/auth/register", { fullName, email, password }),
  verifyOTP: (email, otp) => api.post("/auth/verify-otp", { email, otp }),
};

// Post API endpoints
export const postAPI = {
  // Create post
  createPost: (formDataOrContent, media = []) => {
    // If first param is FormData, use it directly
    if (formDataOrContent instanceof FormData) {
      return api.post("/posts", formDataOrContent);
    }
    // Otherwise, create FormData from content and media
    const formData = new FormData();
    formData.append("content", formDataOrContent);
    media.forEach((item) => {
      formData.append("media", item.file || item);
    });
    return api.post("/posts", formData);
  },

  // Get news feed
  getNewsFeed: (page = 1, limit = 10) =>
    api.get("/posts/feed", { params: { page, limit } }),

  // Get single post
  getPost: (postId) => api.get(`/posts/${postId}`),

  // Update post
  updatePost: (postId, formDataOrContent, media = []) => {
    // If first param is FormData, use it directly
    if (formDataOrContent instanceof FormData) {
      return api.put(`/posts/${postId}`, formDataOrContent);
    }
    // Otherwise, create FormData from content and media
    const formData = new FormData();
    formData.append("content", formDataOrContent);
    media.forEach((item) => {
      formData.append("media", item.file || item);
    });
    return api.put(`/posts/${postId}`, formData);
  },

  // Delete post
  deletePost: (postId) => api.delete(`/posts/${postId}`),

  // Like/Unlike post
  toggleLike: (postId) => api.post(`/posts/${postId}/like`),

  // Get post likes
  getPostLikes: (postId, page = 1, limit = 10) =>
    api.get(`/posts/${postId}/likes`, { params: { page, limit } }),

  // Get post comments
  getPostComments: (postId, page = 1, limit = 10) =>
    api.get(`/posts/${postId}/comments`, { params: { page, limit } }),

  // Get posts by author
  getPostsByAuthor: (authorId, page = 1, limit = 10) =>
    api.get(`/posts/author/${authorId}`, { params: { page, limit } }),

  // Search posts
  searchPosts: (keyword, page = 1, limit = 10) =>
    api.get("/posts/search", { params: { keyword, page, limit } }),
};

// Comment API endpoints
export const commentAPI = {
  // Create comment
  createComment: (postId, content, replyTo = null) =>
    api.post(`/comments/${postId}`, { content, replyTo }),

  // Get post comments
  getPostComments: (postId, page = 1, limit = 20) =>
    api.get(`/comments/${postId}`, { params: { page, limit } }),

  // Update comment
  updateComment: (commentId, content) =>
    api.put(`/comments/${commentId}`, { content }),

  // Delete comment
  deleteComment: (commentId) => api.delete(`/comments/${commentId}`),

  // Like/Unlike comment
  toggleLike: (commentId) => api.post(`/comments/${commentId}/like`),

  // Get comment replies
  getCommentReplies: (commentId, page = 1, limit = 10) =>
    api.get(`/comments/${commentId}/replies`, { params: { page, limit } }),
};

export default api;

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
  // 4.1 Tạo bài viết
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

  // 4.4 Xem news feed
  getNewsFeed: (page = 1, limit = 10) =>
    api.get("/posts/feed", { params: { page, limit } }),

  // Get single post
  getPost: (postId) => api.get(`/posts/${postId}`),

  // 4.2 Chỉnh sửa bài viết
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

  // 4.3 Xóa bài viết
  deletePost: (postId) => api.delete(`/posts/${postId}`),

  // Like/Unlike post
  toggleLike: (postId) => api.post(`/posts/${postId}/like`),

  // 4.5 Xem danh sách like
  getPostLikes: (postId, page = 1, limit = 10) =>
    api.get(`/posts/${postId}/likes`, { params: { page, limit } }),

  // 4.6 Xem danh sách bình luận
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
  // Thêm bình luận
  createComment: (postId, content, replyTo = null) =>
    api.post(`/comments/${postId}`, { content, replyTo }),

  // Lấy bình luận của bài viết
  getPostComments: (postId, page = 1, limit = 20) =>
    api.get(`/comments/${postId}`, { params: { page, limit } }),

  // Chỉnh sửa bình luận
  updateComment: (commentId, content) =>
    api.put(`/comments/${commentId}`, { content }),

  // Xóa bình luận
  deleteComment: (commentId) => api.delete(`/comments/${commentId}`),

  // Like/Unlike bình luận
  toggleLike: (commentId) => api.post(`/comments/${commentId}/like`),

  // Lấy reply của bình luận
  getCommentReplies: (commentId, page = 1, limit = 10) =>
    api.get(`/comments/${commentId}/replies`, { params: { page, limit } }),
};

export default api;

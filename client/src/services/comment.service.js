import apiClient from "./apiClient";

export const commentAPI = {
  createComment: (postId, content, replyTo = null) =>
    apiClient.post(`/comments/${postId}`, { content, replyTo }),
  getPostComments: (postId, page = 1, limit = 20) =>
    apiClient.get(`/comments/${postId}`, { params: { page, limit } }),
  updateComment: (commentId, content) =>
    apiClient.put(`/comments/${commentId}`, { content }),
  deleteComment: (commentId) => apiClient.delete(`/comments/${commentId}`),
  toggleLike: (commentId) => apiClient.post(`/comments/${commentId}/like`),
  getCommentReplies: (commentId, page = 1, limit = 10) =>
    apiClient.get(`/comments/${commentId}/replies`, {
      params: { page, limit },
    }),
};


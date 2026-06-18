import apiClient from "./apiClient";

const createPostFormData = (content, media = []) => {
  const formData = new FormData();
  formData.append("content", content);
  media.forEach((item) => {
    formData.append("media", item.file || item);
  });
  return formData;
};

export const postAPI = {
  createPost: (formDataOrContent, media = []) => {
    if (formDataOrContent instanceof FormData) {
      return apiClient.post("/posts", formDataOrContent);
    }

    return apiClient.post(
      "/posts",
      createPostFormData(formDataOrContent, media),
    );
  },

  getNewsFeed: (page = 1, limit = 10, sortBy = "newest") =>
    apiClient.get("/posts/feed", { params: { page, limit, sortBy } }),

  getSuggestedPosts: (limit = 3) =>
    apiClient.get("/posts/suggested", { params: { limit } }),

  getPost: (postId) => apiClient.get(`/posts/${postId}`),

  updatePost: (postId, formDataOrContent, media = []) => {
    if (formDataOrContent instanceof FormData) {
      return apiClient.put(`/posts/${postId}`, formDataOrContent);
    }

    return apiClient.put(
      `/posts/${postId}`,
      createPostFormData(formDataOrContent, media),
    );
  },

  deletePost: (postId) => apiClient.delete(`/posts/${postId}`),
  hidePost: (postId) => apiClient.post(`/posts/${postId}/hide`),
  toggleSavePost: (postId) => apiClient.post(`/posts/${postId}/save`),
  toggleLike: (postId, reactionType = "like") =>
    apiClient.post(`/posts/${postId}/like`, { reactionType }),
  sharePost: (postId, payload) =>
    apiClient.post(`/posts/${postId}/share`, payload),
  getPostLikes: (postId, page = 1, limit = 10) =>
    apiClient.get(`/posts/${postId}/likes`, { params: { page, limit } }),
  getPostComments: (postId, page = 1, limit = 10) =>
    apiClient.get(`/posts/${postId}/comments`, { params: { page, limit } }),
  getPostsByAuthor: (authorId, page = 1, limit = 10) =>
    apiClient.get(`/posts/author/${authorId}`, { params: { page, limit } }),
  searchPosts: (keyword, page = 1, limit = 10) =>
    apiClient.get("/posts/search", { params: { keyword, page, limit } }),
};

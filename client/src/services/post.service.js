import apiClient from "./apiClient";

const createPostFormData = (content, media = []) => {
  const formData = new FormData();
  formData.append("content", content);
  media.forEach((item) => {
    formData.append("media", item.file || item);
  });
  return formData;
};

const appendOptionalFields = (formData, fields = {}) => {
  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      formData.append(key, value);
    }
  });

  return formData;
};

export const postAPI = {
  createPost: (formDataOrContent, media = [], options = {}) => {
    if (formDataOrContent instanceof FormData) {
      appendOptionalFields(formDataOrContent, options);
      return apiClient.post("/posts", formDataOrContent);
    }

    return apiClient.post(
      "/posts",
      appendOptionalFields(createPostFormData(formDataOrContent, media), options),
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
  getUserMedia: (authorId, { page = 1, limit = 48, type = "all" } = {}) =>
    apiClient.get(`/posts/author/${authorId}/media`, {
      params: { page, limit, type },
    }),
  getUserAlbums: (authorId) => apiClient.get(`/posts/author/${authorId}/albums`),
  createAlbum: (payload) => apiClient.post("/posts/albums", payload),
  updateAlbum: (albumId, payload) =>
    apiClient.put(`/posts/albums/${albumId}`, payload),
  deleteAlbum: (albumId) => apiClient.delete(`/posts/albums/${albumId}`),
  getMediaDownloadUrl: (mediaId) =>
    `/api/posts/media/${encodeURIComponent(mediaId)}/download`,
  getGroupPosts: (groupId, page = 1, limit = 10) =>
    apiClient.get(`/posts/group/${groupId}`, { params: { page, limit } }),
  getPendingGroupPosts: (groupId, page = 1, limit = 10) =>
    apiClient.get(`/posts/group/${groupId}/pending`, { params: { page, limit } }),
  approveGroupPost: (postId) => apiClient.post(`/posts/${postId}/approve`),
  rejectGroupPost: (postId) => apiClient.post(`/posts/${postId}/reject`),
  searchPosts: (keyword, page = 1, limit = 10) =>
    apiClient.get("/posts/search", { params: { keyword, page, limit } }),
};

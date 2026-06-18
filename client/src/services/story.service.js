import apiClient from "./apiClient";

export const storyAPI = {
  getStories: () => apiClient.get("/stories"),
  createStory: ({ text = "", background = "#1877f2", media = null }) => {
    const formData = new FormData();
    formData.append("text", text);
    formData.append("background", background);

    if (media) {
      formData.append("media", media);
    }

    return apiClient.post("/stories", formData);
  },
  getStory: (storyId) => apiClient.get(`/stories/${storyId}`),
  markViewed: (storyId) => apiClient.post(`/stories/${storyId}/view`),
  react: (storyId, reactionType = "like") =>
    apiClient.post(`/stories/${storyId}/react`, { reactionType }),
  reply: (storyId, content) =>
    apiClient.post(`/stories/${storyId}/reply`, { content }),
  getViewers: (storyId) => apiClient.get(`/stories/${storyId}/viewers`),
  deleteStory: (storyId) => apiClient.delete(`/stories/${storyId}`),
};

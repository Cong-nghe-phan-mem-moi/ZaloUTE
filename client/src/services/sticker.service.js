import apiClient from "./apiClient";

export const stickerAPI = {
  getStickerPacks: () => apiClient.get("/stickers"),
};

import apiClient from "./apiClient";

export const reportAPI = {
  createReport: (payload) => apiClient.post("/reports", payload),
};

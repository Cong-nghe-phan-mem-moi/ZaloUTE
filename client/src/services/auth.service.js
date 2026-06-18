import apiClient from "./apiClient";

export const authAPI = {
  login: (credentials) => apiClient.post("/auth/login", credentials),
};

export const registerAPI = {
  register: (fullName, email, password) =>
    apiClient.post("/auth/register", { fullName, email, password }),
  verifyOTP: (email, otp) => apiClient.post("/auth/verify-otp", { email, otp }),
};

export const registerUser = (data) => {
  return apiClient.post("/auth/register", data);
};

export const verifyRegisterOtp = (data) => {
  return apiClient.post("/auth/verify-otp", data);
};

export const requestPasswordResetOtp = (email) =>
  apiClient.post("/auth/forgot-password/request-otp", { email });

export const verifyPasswordResetOtp = (email, otp) =>
  apiClient.post("/auth/forgot-password/verify-otp", { email, otp });

export const resetPassword = (newPassword, resetToken) =>
  apiClient.post(
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

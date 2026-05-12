import api from "./api";

export const registerUser = (data) => {
  return api.post("/auth/register", data);
};

export const verifyRegisterOtp = (data) => {
  return api.post("/auth/verify-otp", data);
};

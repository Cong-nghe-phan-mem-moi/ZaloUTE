const express = require("express");
const router = express.Router();

const {
  register,
  verifyOTP,
  requestPasswordResetOTP,
  verifyPasswordResetOTP,
  resetPassword,
  getResetOtpDev,
  login,
} = require("../controllers/auth.controller");
const {
  validateRegister,
  validateVerifyOTP,
  validateForgotPasswordRequest,
  validateForgotPasswordVerifyOTP,
  validateResetPassword,
} = require("../middleware/validation");
const {
  registerLimiter,
  forgotPasswordRequestLimiter,
  forgotPasswordVerifyLimiter,
  resetPasswordLimiter,
  loginLimiter,
} = require("../middleware/rateLimiter");
const {
  resetPasswordSessionMiddleware,
} = require("../middleware/authMiddleware");

// POST /api/auth/register
router.post("/register", registerLimiter, validateRegister, register);

// POST /api/auth/verify-otp
router.post("/verify-otp", validateVerifyOTP, verifyOTP);

// POST /api/auth/forgot-password/request-otp
router.post(
  "/forgot-password/request-otp",
  forgotPasswordRequestLimiter,
  validateForgotPasswordRequest,
  requestPasswordResetOTP,
);

// POST /api/auth/forgot-password/verify-otp
router.post(
  "/forgot-password/verify-otp",
  forgotPasswordVerifyLimiter,
  validateForgotPasswordVerifyOTP,
  verifyPasswordResetOTP,
);

// POST /api/auth/forgot-password/reset-password
router.post(
  "/forgot-password/reset-password",
  resetPasswordLimiter,
  resetPasswordSessionMiddleware,
  validateResetPassword,
  resetPassword,
);

// GET /api/auth/dev/reset-otp?email=...
router.get("/dev/reset-otp", getResetOtpDev);

router.post("/login", loginLimiter, login);

module.exports = router;

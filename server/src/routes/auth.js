const express = require("express");
const router = express.Router();
const {
  register,
  verifyOTP,
  requestPasswordResetOTP,
  verifyPasswordResetOTP,
  resetPassword,
  getResetOtpDev,
} = require("../controllers/authController");
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
} = require("../middleware/rateLimiter");
const { resetTokenMiddleware } = require("../middleware/authMiddleware");

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
  resetTokenMiddleware,
  validateResetPassword,
  resetPassword,
);

// GET /api/auth/dev/reset-otp?email=...
router.get("/dev/reset-otp", getResetOtpDev);

module.exports = router;

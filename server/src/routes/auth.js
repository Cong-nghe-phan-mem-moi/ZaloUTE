const express = require("express");
const router = express.Router();
const { register, verifyOTP } = require("../controllers/authController");
const {
  validateRegister,
  validateVerifyOTP,
} = require("../middleware/validation");
const { registerLimiter } = require("../middleware/rateLimiter");

// POST /api/auth/register
router.post("/register", registerLimiter, validateRegister, register);

// POST /api/auth/verify-otp
router.post("/verify-otp", validateVerifyOTP, verifyOTP);

module.exports = router;

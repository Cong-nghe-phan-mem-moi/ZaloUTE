const express = require("express");
const router = express.Router();
const { register, verifyOTP, login } = require("../controllers/auth.controller");
const {
  validateRegister,
  validateVerifyOTP,
} = require("../middleware/validation");
const { registerLimiter, loginLimiter } = require("../middleware/rateLimiter");

// POST /api/auth/register
router.post("/register", registerLimiter, validateRegister, register);

// POST /api/auth/verify-otp
router.post("/verify-otp", validateVerifyOTP, verifyOTP);

// router.post("/login", loginLimiter, login);
router.post("/login", login);
module.exports = router;

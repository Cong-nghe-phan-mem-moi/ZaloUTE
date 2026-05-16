const express = require("express");
const router = express.Router();
const UserController = require("../controllers/user.controller");
const authRoutes = require("./auth.route");
const postRoutes = require("./post.route");
const { authMiddleware, authorize } = require("../middleware/authMiddleware");
const { validateEditProfile } = require("../middleware/validateRequest");
const { editProfileLimiter } = require("../middleware/rateLimiter");

// Basic health check endpoint
router.get("/health", (req, res) => {
  res.json({ status: "Server is running" });
});

// User Profile Routes
router.get(
  "/user/profile",
  authMiddleware,
  authorize("user"),
  UserController.getUserProfile,
);
router.put(
  "/user/profile",
  authMiddleware,
  authorize("user"),
  editProfileLimiter,
  validateEditProfile,
  UserController.editProfile,
);

// Admin Profile Routes
router.get(
  "/admin/profile",
  authMiddleware,
  authorize("admin"),
  UserController.getAdminProfile,
);

// General Profile Routes
router.get("/profile", authMiddleware, UserController.getProfile);
router.put("/profile", authMiddleware, validateEditProfile, UserController.editProfile);

// Post Routes
router.use("/posts", postRoutes);

// Authentication routes
router.use("/auth", authRoutes);

module.exports = router;

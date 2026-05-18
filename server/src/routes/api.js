const express = require("express");
const router = express.Router();
const UserController = require("../controllers/user.controller");
const authRoutes = require("./auth.route");
const { authMiddleware, authorize } = require("../middleware/authMiddleware");
const { validateEditProfile } = require("../middleware/validateRequest");
const { editProfileLimiter } = require("../middleware/rateLimiter");
const userRoutes = require("./user.route");

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


// Authentication routes
router.use("/auth", authRoutes);
router.use("/users", userRoutes);

module.exports = router;

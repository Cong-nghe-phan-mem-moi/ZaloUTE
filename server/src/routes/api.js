const express = require("express");
const router = express.Router();
const UserController = require("../controllers/user.controller");
const authRoutes = require("./auth.route");
const postRoutes = require("./post.route");
const commentRoutes = require("./comment.route");
const notificationRoutes = require("./notification.route");
const storyRoutes = require("./story.route");
const adminRoutes = require("./admin.route");
const { authMiddleware, authorize } = require("../middleware/authMiddleware");
const { validateEditProfile } = require("../middleware/validateRequest");
const { editProfileLimiter } = require("../middleware/rateLimiter");
const userRoutes = require("./user.route");
const upload = require("../middleware/uploadMiddleware");

// Basic health check endpoint
router.get("/health", (req, res) => {
  res.json({ status: "Server is running" });
});

// User Profile Routes
router.get(
  "/user/profile",
  authMiddleware,
  authorize("user"),
  UserController.getMyProfileIsUser,
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
  UserController.getMyProfileIsAdmin,
);

// General Profile Routes
router.get("/profile", authMiddleware, UserController.getMyProfile);
router.put("/profile", authMiddleware, validateEditProfile, UserController.editProfile);
router.put(
  "/profile/avatar",
  authMiddleware,
  upload.imageUpload.single("avatar"),
  UserController.handleMulterError,
  UserController.uploadAvatar,
);
router.put(
  "/profile/cover-image",
  authMiddleware,
  upload.imageUpload.single("coverImage"),
  UserController.handleMulterError,
  UserController.uploadCoverImage,
);

// Comment Routes
router.use("/comments", commentRoutes);
router.use("/notifications", notificationRoutes);
router.use("/stories", storyRoutes);

// Authentication routes
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/admin", adminRoutes);

// Post routes
router.use("/posts", postRoutes);
module.exports = router;

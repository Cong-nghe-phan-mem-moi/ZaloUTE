const express = require("express");
const router = express.Router();

const userController = require("../controllers/user.controller");
const authMiddleware = require("../middlewares/authMiddleware");
const friendRequestController = require("../controllers/friendRequest.controller");
const FollowController = require("../controllers/follow.controller");

router.get(
  "/search",
  authMiddleware.authMiddleware,
  userController.handleGlobalSearch,
);

router.get(
  "/profile/:id",
  authMiddleware.authMiddleware,
  userController.getOtherUserProfile,
);

router.get(
  "/blocked",
  authMiddleware.authMiddleware,
  userController.getBlockedUsers,
);

router.get(
  "/account-settings",
  authMiddleware.authMiddleware,
  userController.getAccountSettings,
);

router.put(
  "/account-settings/password",
  authMiddleware.authMiddleware,
  userController.changePassword,
);

router.put(
  "/account-settings/contact",
  authMiddleware.authMiddleware,
  userController.updateContactInfo,
);

router.put(
  "/account-settings/notifications",
  authMiddleware.authMiddleware,
  userController.updateNotificationSettings,
);

router.put(
  "/account-settings/privacy",
  authMiddleware.authMiddleware,
  userController.updatePrivacySettings,
);

router.delete(
  "/account-settings/sessions/:sessionId",
  authMiddleware.authMiddleware,
  userController.revokeSession,
);

router.delete(
  "/account-settings/sessions",
  authMiddleware.authMiddleware,
  userController.revokeOtherSessions,
);

router.delete(
  "/account-settings",
  authMiddleware.authMiddleware,
  userController.deactivateAccount,
);

router.post(
  "/:id/block",
  authMiddleware.authMiddleware,
  userController.blockUser,
);

router.post(
  "/:id/unblock",
  authMiddleware.authMiddleware,
  userController.unblockUser,
);

router.post(
  "/:id/follow",
  authMiddleware.authMiddleware,
  FollowController.toggleFollowUser,
);

router.post(
  "/friend-request",
  authMiddleware.authMiddleware,
  friendRequestController.handleSendFriendRequest,
);
router.get(
  "/friend-request/incoming",
  authMiddleware.authMiddleware,
  friendRequestController.handleGetIncomingFriendRequests,
);
router.get(
  "/friend-request/outgoing",
  authMiddleware.authMiddleware,
  friendRequestController.handleGetOutgoingFriendRequests,
);

router.put(
  "/friend-request/accept",
  authMiddleware.authMiddleware,
  friendRequestController.handleAcceptFriendRequest,
);
router.put(
  "/friend-request/reject",
  authMiddleware.authMiddleware,
  friendRequestController.handleRejectFriendRequest,
);
router.delete(
  "/friend-request/cancel",
  authMiddleware.authMiddleware,
  friendRequestController.handleCancelFriendRequest,
);
router.delete(
  "/friend-request/unfriend",
  authMiddleware.authMiddleware,
  friendRequestController.handleUnfriend,
);

router.post("/logout", authMiddleware.authMiddleware, userController.logout);

module.exports = router;

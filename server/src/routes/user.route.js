const express = require("express");
const router = express.Router();

const userController = require("../controllers/user.controller");
const authMiddleware = require("../middleware/authMiddleware");
const friendRequestController = require("../controllers/friendRequest.controller");

router.get(
  "/search",
  authMiddleware.authMiddleware,
  userController.searchUsers,
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

const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chat.controller");
const { authMiddleware } = require("../middlewares/authMiddleware");
const upload = require("../middlewares/uploadMiddleware");
router.get("/images/:fileId", chatController.proxyConversationImage);

router.use(authMiddleware);
router.get("/conversations", chatController.getConversations);
router.get("/conversations/badge", chatController.getConversationBadge);
router.post("/conversations", chatController.getOrCreateConversation);
router.post("/conversations/seen", chatController.markConversationsAsSeen);
router.get("/conversations/:conversationId/messages", chatController.getMessages);
router.post(
  "/conversations/:conversationId/images",
  upload.imageUpload.single("image"),
  upload.handleUploadError,
  chatController.uploadConversationImage,
);
router.post("/groups", chatController.createGroup);
router.post("/groups/:conversationId/remove-member", chatController.removeMember);
router.post("/groups/:conversationId/leave", chatController.leaveGroup);
router.post("/groups/:conversationId/add-members", chatController.addMembers);
router.post("/conversations/:conversationId/mute", chatController.muteConversation);
router.post("/conversations/:conversationId/unmute", chatController.unmuteConversation);
router.post("/conversations/:conversationId/block", chatController.blockConversation);
router.post("/conversations/:conversationId/unblock", chatController.unblockConversation);
router.delete("/conversations/:conversationId", chatController.deleteConversation);

module.exports = router;

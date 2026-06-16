const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chat.controller");
const { authMiddleware } = require("../middleware/authMiddleware");

// Áp dụng middleware xác thực cho tất cả route chat
router.use(authMiddleware);

// Lấy danh sách hội thoại
router.get("/conversations", chatController.getConversations);

// Lấy hoặc tạo hội thoại 1-1 với user khác
router.post("/conversations", chatController.getOrCreateConversation);

// Lấy tin nhắn trong hội thoại
router.get("/conversations/:conversationId/messages", chatController.getMessages);

// Tạo nhóm chat mới
router.post("/groups", chatController.createGroup);

// Xóa thành viên khỏi nhóm chat
router.post("/groups/:conversationId/remove-member", chatController.removeMember);

// Thành viên tự rời khỏi nhóm
router.post("/groups/:conversationId/leave", chatController.leaveGroup);

// Thêm thành viên vào nhóm chat
router.post("/groups/:conversationId/add-members", chatController.addMembers);

module.exports = router;

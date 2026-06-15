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

module.exports = router;

const express = require("express");
const router = express.Router();
const NotificationController = require("../controllers/notification.controller");
const { authMiddleware } = require("../middleware/authMiddleware");

router.use(authMiddleware);
router.get("/", NotificationController.getNotifications);
router.put("/read-all", NotificationController.markAllAsRead);
router.put("/:notificationId/read", NotificationController.markAsRead);

module.exports = router;

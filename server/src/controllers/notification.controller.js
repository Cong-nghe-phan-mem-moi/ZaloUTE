const NotificationService = require("../service/notification.service");

class NotificationController {
  static async getNotifications(req, res) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const result = await NotificationService.getNotifications(
        req.user.userId,
        parseInt(page),
        parseInt(limit),
      );

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Error fetching notifications:", error);
      return res.status(500).json({
        success: false,
        message: "Unable to load notifications",
      });
    }
  }

  static async markAsRead(req, res) {
    try {
      const notification = await NotificationService.markAsRead(
        req.params.notificationId,
        req.user.userId,
      );

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: "Notification not found",
        });
      }

      return res.status(200).json({
        success: true,
        data: notification,
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      return res.status(400).json({
        success: false,
        message: "Unable to mark notification as read",
      });
    }
  }

  static async markAllAsRead(req, res) {
    try {
      await NotificationService.markAllAsRead(req.user.userId);
      return res.status(200).json({
        success: true,
        message: "Notifications marked as read",
      });
    } catch (error) {
      console.error("Error marking notifications as read:", error);
      return res.status(400).json({
        success: false,
        message: "Unable to mark notifications as read",
      });
    }
  }
}

module.exports = NotificationController;

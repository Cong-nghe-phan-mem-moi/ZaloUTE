const UserService = require("../services/user.service");

class FollowController {
  static async toggleFollowUser(req, res) {
    try {
      const result = await UserService.toggleFollowUser(
        req.user.userId,
        req.params.id,
      );

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Follow User Error:", error);

      return res.status(error.statusCode || 500).json({
        success: false,
        code: error.code || "INTERNAL_SERVER_ERROR",
        message: error.message || "Internal server error",
      });
    }
  }
}

module.exports = FollowController;

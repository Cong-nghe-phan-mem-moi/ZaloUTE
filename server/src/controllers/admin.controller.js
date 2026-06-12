const AdminService = require("../service/admin.service");

const sendError = (res, error) => {
  const status = error.message?.includes("not found") ? 404 : 400;
  return res.status(status).json({
    success: false,
    message: error.message || "Admin request failed",
  });
};

class AdminController {
  static async getStats(req, res) {
    try {
      const data = await AdminService.getStats();
      return res.status(200).json({ success: true, data });
    } catch (error) {
      return sendError(res, error);
    }
  }

  static async getUsers(req, res) {
    try {
      const data = await AdminService.getUsers(req.query);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      return sendError(res, error);
    }
  }

  static async updateUserStatus(req, res) {
    try {
      const data = await AdminService.updateUserStatus(
        req.params.userId,
        req.body.status,
      );
      return res.status(200).json({ success: true, data });
    } catch (error) {
      return sendError(res, error);
    }
  }

  static async deleteUser(req, res) {
    try {
      await AdminService.deleteUser(req.params.userId);
      return res.status(200).json({ success: true, message: "User deleted" });
    } catch (error) {
      return sendError(res, error);
    }
  }

  static async getPosts(req, res) {
    try {
      const data = await AdminService.getPosts(req.query);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      return sendError(res, error);
    }
  }

  static async deletePost(req, res) {
    try {
      await AdminService.deletePost(req.params.postId);
      return res.status(200).json({ success: true, message: "Post deleted" });
    } catch (error) {
      return sendError(res, error);
    }
  }

  static async getStickers(req, res) {
    try {
      const data = await AdminService.getStickers(req.query);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      return sendError(res, error);
    }
  }

  static async createSticker(req, res) {
    try {
      const data = await AdminService.createSticker(req.body);
      return res.status(201).json({ success: true, data });
    } catch (error) {
      return sendError(res, error);
    }
  }

  static async updateSticker(req, res) {
    try {
      const data = await AdminService.updateSticker(
        req.params.stickerId,
        req.body,
      );
      return res.status(200).json({ success: true, data });
    } catch (error) {
      return sendError(res, error);
    }
  }

  static async deleteSticker(req, res) {
    try {
      await AdminService.deleteSticker(req.params.stickerId);
      return res.status(200).json({ success: true, message: "Sticker deleted" });
    } catch (error) {
      return sendError(res, error);
    }
  }
}

module.exports = AdminController;

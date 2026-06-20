const AdminService = require("../services/admin.service");

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
        req.user.userId,
        req.body,
      );
      return res.status(200).json({ success: true, data });
    } catch (error) {
      return sendError(res, error);
    }
  }

  static async getUserDetail(req, res) {
    try {
      const data = await AdminService.getUserDetail(req.params.userId);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      return sendError(res, error);
    }
  }

  static async deleteUser(req, res) {
    try {
      await AdminService.deleteUser(req.params.userId, req.user.userId);
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
      await AdminService.deletePost(req.params.postId, req.user.userId);
      return res.status(200).json({ success: true, message: "Post deleted" });
    } catch (error) {
      return sendError(res, error);
    }
  }

  static async hidePost(req, res) {
    try {
      const data = await AdminService.hidePost(
        req.params.postId,
        req.user.userId,
        req.body.reason || "",
      );
      return res.status(200).json({ success: true, data });
    } catch (error) {
      return sendError(res, error);
    }
  }

  static async getComments(req, res) {
    try {
      const data = await AdminService.getComments(req.query);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      return sendError(res, error);
    }
  }

  static async deleteComment(req, res) {
    try {
      await AdminService.deleteComment(req.params.commentId, req.user.userId);
      return res.status(200).json({ success: true, message: "Comment deleted" });
    } catch (error) {
      return sendError(res, error);
    }
  }

  static async getReports(req, res) {
    try {
      const data = await AdminService.getReports(req.query);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      return sendError(res, error);
    }
  }

  static async resolveReport(req, res) {
    try {
      const data = await AdminService.resolveReport(
        req.params.reportId,
        req.user.userId,
        req.body,
      );
      return res.status(200).json({ success: true, data });
    } catch (error) {
      return sendError(res, error);
    }
  }

  static async getActionLogs(req, res) {
    try {
      const data = await AdminService.getActionLogs(req.query);
      return res.status(200).json({ success: true, data });
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
      const data = await AdminService.createSticker(req.body, req.user.userId);
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
        req.user.userId,
      );
      return res.status(200).json({ success: true, data });
    } catch (error) {
      return sendError(res, error);
    }
  }

  static async deleteSticker(req, res) {
    try {
      await AdminService.deleteSticker(req.params.stickerId, req.user.userId);
      return res.status(200).json({ success: true, message: "Sticker deleted" });
    } catch (error) {
      return sendError(res, error);
    }
  }
}

module.exports = AdminController;

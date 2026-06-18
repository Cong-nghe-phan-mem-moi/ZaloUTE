const Account = require("../models/account.model");
const AdminActionLog = require("../models/adminActionLog.model");
const Comment = require("../models/comment.model");
const Post = require("../models/post.model");
const { Report } = require("../models/report.model");
const Sticker = require("../models/sticker.model");
const User = require("../models/user.model");
const NotificationService = require("./notification.service");

const normalizePage = (page) => Math.max(1, parseInt(page) || 1);
const normalizeLimit = (limit) => Math.min(100, Math.max(1, parseInt(limit) || 20));

const buildPagination = (page, limit, total) => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
});

class AdminService {
  static async logAction(adminId, action, targetType, targetId = null, note = "", metadata = {}) {
    if (!adminId) return null;

    return await AdminActionLog.create({
      admin: adminId,
      action,
      targetType,
      targetId,
      note,
      metadata,
    });
  }

  static async getStats() {
    const [users, posts, stickers, bannedUsers, reports, comments, growth] = await Promise.all([
      User.countDocuments(),
      Post.countDocuments(),
      Sticker.countDocuments(),
      Account.countDocuments({ status: "banned" }),
      Report.countDocuments({ status: "pending" }),
      Comment.countDocuments(),
      this.getGrowthStats(),
    ]);

    return { users, posts, stickers, bannedUsers, reports, comments, growth };
  }

  static async getGrowthStats(days = 7) {
    const since = new Date();
    since.setDate(since.getDate() - (days - 1));
    since.setHours(0, 0, 0, 0);

    const [userGrowth, postGrowth] = await Promise.all([
      User.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
      ]),
      Post.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
      ]),
    ]);

    const userMap = new Map(userGrowth.map((item) => [item._id, item.count]));
    const postMap = new Map(postGrowth.map((item) => [item._id, item.count]));

    return Array.from({ length: days }, (_, index) => {
      const date = new Date(since);
      date.setDate(since.getDate() + index);
      const key = date.toISOString().slice(0, 10);

      return {
        date: key,
        users: userMap.get(key) || 0,
        posts: postMap.get(key) || 0,
      };
    });
  }

  static async getUsers({ page = 1, limit = 20, keyword = "" }) {
    const currentPage = normalizePage(page);
    const currentLimit = normalizeLimit(limit);
    const skip = (currentPage - 1) * currentLimit;
    const condition = {};

    if (keyword.trim()) {
      condition.$or = [
        { fullName: { $regex: keyword.trim(), $options: "i" } },
        { phone: { $regex: keyword.trim(), $options: "i" } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(condition)
        .populate("account", "email role status suspendedUntil suspensionReason createdAt")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(currentLimit),
      User.countDocuments(condition),
    ]);

    return {
      users,
      pagination: buildPagination(currentPage, currentLimit, total),
    };
  }

  static async getUserDetail(userId) {
    const user = await User.findById(userId)
      .populate("account", "email role status suspendedUntil suspensionReason createdAt")
      .populate("friends", "fullName avatar")
      .populate("followers", "fullName avatar")
      .populate("following", "fullName avatar");

    if (!user) throw new Error("User not found");

    const [posts, comments, reports] = await Promise.all([
      Post.countDocuments({ author: userId }),
      Comment.countDocuments({ author: userId }),
      Report.countDocuments({ targetType: "User", targetId: userId }),
    ]);

    return { user, activity: { posts, comments, reports } };
  }

  static async updateUserStatus(userId, status, adminId = null, payload = {}) {
    if (!["active", "inactive", "banned", "pending", "suspended"].includes(status)) {
      throw new Error("Invalid account status");
    }

    const user = await User.findById(userId).populate("account");
    if (!user || !user.account) {
      throw new Error("User not found");
    }

    user.account.status = status;
    user.account.suspendedUntil =
      status === "suspended" && payload.suspendedUntil
        ? new Date(payload.suspendedUntil)
        : null;
    user.account.suspensionReason = status === "suspended" ? payload.reason || "" : "";
    await user.account.save();

    await this.logAction(adminId, "update_user_status", "User", userId, payload.reason || status, {
      status,
      suspendedUntil: user.account.suspendedUntil,
    });

    return await User.findById(userId).populate(
      "account",
      "email role status suspendedUntil suspensionReason createdAt",
    );
  }

  static async deleteUser(userId, adminId = null) {
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    const posts = await Post.find({ author: userId }).select("_id");
    const postIds = posts.map((post) => post._id);

    await Promise.all([
      Account.deleteOne({ user: userId }),
      Comment.deleteMany({
        $or: [{ author: userId }, { post: { $in: postIds } }],
      }),
      Post.deleteMany({ author: userId }),
      User.updateMany({}, { $pull: { friends: userId } }),
      User.deleteOne({ _id: userId }),
    ]);

    await this.logAction(adminId, "delete_user", "User", userId, "Deleted user");
  }

  static async getPosts({ page = 1, limit = 20, keyword = "" }) {
    const currentPage = normalizePage(page);
    const currentLimit = normalizeLimit(limit);
    const skip = (currentPage - 1) * currentLimit;
    const condition = {};

    if (keyword.trim()) {
      condition.content = { $regex: keyword.trim(), $options: "i" };
    }

    const [posts, total] = await Promise.all([
      Post.find(condition)
        .populate("author", "fullName avatar")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(currentLimit),
      Post.countDocuments(condition),
    ]);

    const postsWithCounts = await Promise.all(
      posts.map(async (post) => {
        const postObj = post.toObject();
        postObj.commentCount = await Comment.countDocuments({ post: post._id });
        return postObj;
      }),
    );

    return {
      posts: postsWithCounts,
      pagination: buildPagination(currentPage, currentLimit, total),
    };
  }

  static async deletePost(postId, adminId = null) {
    const post = await Post.findById(postId);
    if (!post) throw new Error("Post not found");

    await Promise.all([
      Comment.deleteMany({ post: postId }),
      Post.deleteOne({ _id: postId }),
    ]);

    await this.logAction(adminId, "delete_post", "Post", postId, "Deleted post");
  }

  static async hidePost(postId, adminId, reason = "") {
    const post = await Post.findByIdAndUpdate(
      postId,
      {
        moderation: {
          hidden: true,
          hiddenReason: reason,
          hiddenBy: adminId,
          hiddenAt: new Date(),
        },
      },
      { new: true },
    ).populate("author", "fullName avatar");

    if (!post) throw new Error("Post not found");

    await this.logAction(adminId, "hide_post", "Post", postId, reason);
    return post;
  }

  static async getComments({ page = 1, limit = 20, keyword = "" }) {
    const currentPage = normalizePage(page);
    const currentLimit = normalizeLimit(limit);
    const skip = (currentPage - 1) * currentLimit;
    const condition = {};

    if (keyword.trim()) {
      condition.content = { $regex: keyword.trim(), $options: "i" };
    }

    const [comments, total] = await Promise.all([
      Comment.find(condition)
        .populate("author", "fullName avatar")
        .populate("post", "content")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(currentLimit),
      Comment.countDocuments(condition),
    ]);

    return {
      comments,
      pagination: buildPagination(currentPage, currentLimit, total),
    };
  }

  static async deleteComment(commentId, adminId) {
    const comment = await Comment.findById(commentId);
    if (!comment) throw new Error("Comment not found");

    await Promise.all([
      Comment.deleteMany({ $or: [{ _id: commentId }, { replyTo: commentId }] }),
      Post.findByIdAndUpdate(comment.post, { $inc: { commentCount: -1 } }),
    ]);

    await this.logAction(adminId, "delete_comment", "Comment", commentId, "Deleted comment");
  }

  static async getReports({ page = 1, limit = 20, status = "", targetType = "" }) {
    const currentPage = normalizePage(page);
    const currentLimit = normalizeLimit(limit);
    const skip = (currentPage - 1) * currentLimit;
    const condition = {};

    if (status) condition.status = status;
    if (targetType) condition.targetType = targetType;

    const [reports, total] = await Promise.all([
      Report.find(condition)
        .populate("reporter", "fullName avatar")
        .populate("handledBy", "fullName avatar")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(currentLimit)
        .lean(),
      Report.countDocuments(condition),
    ]);

    const hydratedReports = await Promise.all(
      reports.map(async (report) => {
        let target = null;
        if (report.targetType === "Post") {
          target = await Post.findById(report.targetId).populate("author", "fullName avatar").lean();
        }
        if (report.targetType === "Comment") {
          target = await Comment.findById(report.targetId).populate("author", "fullName avatar").lean();
        }
        if (report.targetType === "User") {
          target = await User.findById(report.targetId).populate("account", "email status").lean();
        }

        return { ...report, target };
      }),
    );

    return {
      reports: hydratedReports,
      pagination: buildPagination(currentPage, currentLimit, total),
    };
  }

  static async resolveReport(reportId, adminId, payload = {}) {
    const { action, note = "", suspendDays = 7 } = payload;
    const report = await Report.findById(reportId);
    if (!report) throw new Error("Report not found");

    if (!["ignore", "warn", "hide_post", "suspend_account"].includes(action)) {
      throw new Error("Invalid moderation action");
    }

    let status = "ignored";

    if (action === "warn") {
      status = "warned";
      let receiver = null;
      if (report.targetType === "User") receiver = report.targetId;
      if (report.targetType === "Post") {
        const post = await Post.findById(report.targetId).select("author");
        receiver = post?.author;
      }
      if (report.targetType === "Comment") {
        const comment = await Comment.findById(report.targetId).select("author");
        receiver = comment?.author;
      }
      if (receiver) {
        await NotificationService.createNotification({
          receiver,
          sender: adminId,
          type: "system",
          content: "Your content received a moderation warning",
          preview: note,
          relatedId: report._id,
          relatedType: null,
          data: { reportId: report._id, action: "warn" },
        });
      }
    }

    if (action === "hide_post") {
      if (report.targetType === "Post") {
        await this.hidePost(report.targetId, adminId, note || "Hidden after report review");
      }
      if (report.targetType === "Comment") {
        await this.deleteComment(report.targetId, adminId);
      }
      status = "hidden";
    }

    if (action === "suspend_account") {
      let userId = report.targetType === "User" ? report.targetId : null;
      if (report.targetType === "Post") {
        const post = await Post.findById(report.targetId).select("author");
        userId = post?.author;
      }
      if (report.targetType === "Comment") {
        const comment = await Comment.findById(report.targetId).select("author");
        userId = comment?.author;
      }

      if (!userId) throw new Error("Unable to identify account");

      const suspendedUntil = new Date();
      suspendedUntil.setDate(suspendedUntil.getDate() + Math.max(1, parseInt(suspendDays) || 7));
      await this.updateUserStatus(userId, "suspended", adminId, {
        suspendedUntil,
        reason: note || "Suspended after report review",
      });
      status = "account_suspended";
    }

    report.status = status;
    report.handledBy = adminId;
    report.handledAt = new Date();
    report.resolutionNote = note;
    await report.save();

    await this.logAction(adminId, `report_${action}`, "Report", report._id, note, {
      reportTargetType: report.targetType,
      reportTargetId: report.targetId,
    });

    return report;
  }

  static async getActionLogs({ page = 1, limit = 20 }) {
    const currentPage = normalizePage(page);
    const currentLimit = normalizeLimit(limit);
    const skip = (currentPage - 1) * currentLimit;

    const [logs, total] = await Promise.all([
      AdminActionLog.find()
        .populate("admin", "fullName avatar")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(currentLimit),
      AdminActionLog.countDocuments(),
    ]);

    return {
      logs,
      pagination: buildPagination(currentPage, currentLimit, total),
    };
  }

  static async getStickers({ page = 1, limit = 20, keyword = "" }) {
    const currentPage = normalizePage(page);
    const currentLimit = normalizeLimit(limit);
    const skip = (currentPage - 1) * currentLimit;
    const condition = {};

    if (keyword.trim()) {
      condition.$or = [
        { name: { $regex: keyword.trim(), $options: "i" } },
        { packName: { $regex: keyword.trim(), $options: "i" } },
        { category: { $regex: keyword.trim(), $options: "i" } },
      ];
    }

    const [stickers, total] = await Promise.all([
      Sticker.find(condition).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(currentLimit),
      Sticker.countDocuments(condition),
    ]);

    return {
      stickers,
      pagination: buildPagination(currentPage, currentLimit, total),
    };
  }

  static async createSticker(data, adminId = null) {
    const packName = data.packName?.trim() || data.category?.trim() || "";
    const category = data.category?.trim() || packName;
    const stickerItems = Array.isArray(data.stickers)
      ? data.stickers
      : [{ name: data.name, imageUrl: data.imageUrl }];
    const validItems = stickerItems
      .map((item, index) => ({
        name: item.name?.trim() || `${packName || "Sticker"} ${index + 1}`,
        imageUrl: item.imageUrl?.trim() || "",
      }))
      .filter((item) => item.imageUrl);

    if (!packName || validItems.length === 0) {
      throw new Error("Sticker pack name and at least one image URL are required");
    }

    const created = await Sticker.insertMany(
      validItems.map((item) => ({
        name: item.name,
        packName,
        category,
        imageUrl: item.imageUrl,
      })),
    );

    await this.logAction(adminId, "create_sticker_pack", "Sticker", created[0]?._id, packName, {
      count: created.length,
    });

    return created;
  }

  static async updateSticker(stickerId, data, adminId = null) {
    const updateData = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.packName !== undefined) updateData.packName = data.packName.trim();
    if (data.category !== undefined) updateData.category = data.category.trim();
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl.trim();

    const sticker = await Sticker.findByIdAndUpdate(stickerId, updateData, {
      new: true,
      runValidators: true,
    });

    if (!sticker) throw new Error("Sticker not found");
    await this.logAction(adminId, "update_sticker", "Sticker", stickerId, sticker.name);
    return sticker;
  }

  static async deleteSticker(stickerId, adminId = null) {
    const sticker = await Sticker.findByIdAndDelete(stickerId);
    if (!sticker) throw new Error("Sticker not found");
    await this.logAction(adminId, "delete_sticker", "Sticker", stickerId, sticker.name);
  }
}

module.exports = AdminService;

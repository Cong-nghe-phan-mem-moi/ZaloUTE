const mongoose = require("mongoose");
const Comment = require("../models/comment.model");
const Post = require("../models/post.model");
const User = require("../models/user.model");
const {
  Report,
  REPORT_REASONS,
  REPORT_TARGET_TYPES,
} = require("../models/report.model");

const targetModels = {
  Post,
  Comment,
  User,
};

class ReportService {
  static async createReport(reporterId, payload = {}) {
    const { targetType, targetId, reason, details = "" } = payload;

    if (!REPORT_TARGET_TYPES.includes(targetType)) {
      throw new Error("Invalid report target");
    }

    if (!REPORT_REASONS.includes(reason)) {
      throw new Error("Invalid report reason");
    }

    if (!mongoose.Types.ObjectId.isValid(targetId)) {
      throw new Error("Invalid target");
    }

    if (targetType === "User" && String(targetId) === String(reporterId)) {
      throw new Error("You cannot report yourself");
    }

    const TargetModel = targetModels[targetType];
    const target = await TargetModel.findById(targetId);
    if (!target) {
      throw new Error("Reported content was not found");
    }

    try {
      return await Report.create({
        reporter: reporterId,
        targetType,
        targetId,
        reason,
        details: details.trim(),
      });
    } catch (error) {
      if (error.code === 11000) {
        throw new Error("You already reported this item");
      }

      throw error;
    }
  }
}

module.exports = ReportService;

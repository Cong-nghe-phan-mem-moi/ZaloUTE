const mongoose = require("mongoose");

const REPORT_REASONS = ["spam", "bad_content", "fake", "harassment"];
const REPORT_TARGET_TYPES = ["Post", "Comment", "User"];
const REPORT_STATUS = ["pending", "ignored", "warned", "hidden", "account_suspended"];

const reportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    targetType: {
      type: String,
      enum: REPORT_TARGET_TYPES,
      required: true,
      index: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    reason: {
      type: String,
      enum: REPORT_REASONS,
      required: true,
    },
    details: {
      type: String,
      default: "",
      maxlength: 1000,
    },
    status: {
      type: String,
      enum: REPORT_STATUS,
      default: "pending",
      index: true,
    },
    handledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    handledAt: {
      type: Date,
      default: null,
    },
    resolutionNote: {
      type: String,
      default: "",
      maxlength: 1000,
    },
  },
  { timestamps: true },
);

reportSchema.index(
  { reporter: 1, targetType: 1, targetId: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: "pending" } },
);

module.exports = {
  Report: mongoose.model("Report", reportSchema),
  REPORT_REASONS,
  REPORT_STATUS,
  REPORT_TARGET_TYPES,
};

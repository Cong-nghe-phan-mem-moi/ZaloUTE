const mongoose = require("mongoose");

const adminActionLogSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    targetType: {
      type: String,
      enum: ["Post", "Comment", "User", "Report", "Sticker", "Account"],
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    note: {
      type: String,
      default: "",
      maxlength: 1000,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("AdminActionLog", adminActionLogSchema);

const Account = require("../models/account.model");
const Comment = require("../models/comment.model");
const Post = require("../models/post.model");
const Sticker = require("../models/sticker.model");
const User = require("../models/user.model");

const normalizePage = (page) => Math.max(1, parseInt(page) || 1);
const normalizeLimit = (limit) => Math.min(100, Math.max(1, parseInt(limit) || 20));

const buildPagination = (page, limit, total) => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
});

class AdminService {
  static async getStats() {
    const [users, posts, stickers, bannedUsers] = await Promise.all([
      User.countDocuments(),
      Post.countDocuments(),
      Sticker.countDocuments(),
      Account.countDocuments({ status: "banned" }),
    ]);

    return { users, posts, stickers, bannedUsers };
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
        .populate("account", "email role status createdAt")
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

  static async updateUserStatus(userId, status) {
    if (!["active", "inactive", "banned", "pending"].includes(status)) {
      throw new Error("Invalid account status");
    }

    const user = await User.findById(userId).populate("account");
    if (!user || !user.account) {
      throw new Error("User not found");
    }

    user.account.status = status;
    await user.account.save();

    return await User.findById(userId).populate("account", "email role status createdAt");
  }

  static async deleteUser(userId) {
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

  static async deletePost(postId) {
    const post = await Post.findById(postId);
    if (!post) throw new Error("Post not found");

    await Promise.all([
      Comment.deleteMany({ post: postId }),
      Post.deleteOne({ _id: postId }),
    ]);
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

  static async createSticker(data) {
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

    return await Sticker.insertMany(
      validItems.map((item) => ({
        name: item.name,
        packName,
        category,
        imageUrl: item.imageUrl,
      })),
    );
  }

  static async updateSticker(stickerId, data) {
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
    return sticker;
  }

  static async deleteSticker(stickerId) {
    const sticker = await Sticker.findByIdAndDelete(stickerId);
    if (!sticker) throw new Error("Sticker not found");
  }
}

module.exports = AdminService;

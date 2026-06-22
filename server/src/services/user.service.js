const bcrypt = require("bcrypt");
const UserRepository = require("../repositories/user.repository");
const AuthRepository = require("../repositories/auth.repository");
const GroupRepository = require("../repositories/group.repository");
const PostRepository = require("../repositories/post.repository");
const FriendRequestService = require("./friendRequest.service");
const FriendRequestRepo = require("../repositories/friendRequest.repository");
const { removeVietnameseTones } = require("../utils/stringUtil");
const {
  buildPrivacyMongoFilter,
  canViewPostWithSharedSource,
  getFriendIdSet,
} = require("../utils/privacy");
const throwError = (statusCode, code, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  throw error;
};

const buildProfileResponse = (user) => ({
  userId: user._id,
  fullName: user.fullName,
  email: user.account?.email,
  phone: user.phone,
  avatar: user.avatar,
  coverImage: user.coverImage,
  bio: user.bio,
  dateOfBirth: user.dateOfBirth,
  gender: user.gender,
  address: user.address,
  socialLinks: {
    facebook: user.socialLinks?.facebook || "",
    instagram: user.socialLinks?.instagram || "",
    tiktok: user.socialLinks?.tiktok || "",
    youtube: user.socialLinks?.youtube || "",
    website: user.socialLinks?.website || "",
  },
  isOnline: user.isOnline,
  lastActive: user.lastActive,
  friendsCount: user.friends?.length || 0,
  followingCount: user.following?.length || 0,
  followersCount: user.followers?.length || 0,
  friends: (user.friends || []).map((friend) => {
    const friendId = friend?._id || friend?.id || friend;

    return {
      id: friendId?.toString?.() || friendId,
      fullName: friend.fullName || friend.name || "Unknown",
      avatar: friend.avatar || friend.image || null,
      isOnline: friend.isOnline || false,
      lastActive: friend.lastActive || null,
    };
  }),
  following: (user.following || []).map((followedUser) => ({
    id:
      followedUser?._id?.toString?.() ||
      followedUser?.toString?.() ||
      followedUser,
    fullName: followedUser?.fullName || "Unknown",
    avatar: followedUser?.avatar || null,
    isOnline: followedUser?.isOnline || false,
    lastActive: followedUser?.lastActive || null,
  })),
  followers: (user.followers || []).map((follower) => ({
    id: follower?._id?.toString?.() || follower?.toString?.() || follower,
    fullName: follower?.fullName || "Unknown",
    avatar: follower?.avatar || null,
    isOnline: follower?.isOnline || false,
    lastActive: follower?.lastActive || null,
  })),
  blockedUsers: (user.blockedUsers || []).map((blockedUser) => ({
    id:
      blockedUser?._id?.toString?.() ||
      blockedUser?.toString?.() ||
      blockedUser,
    fullName: blockedUser?.fullName || "Unknown",
    avatar: blockedUser?.avatar || null,
  })),
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const isUserBlocked = (user, targetUserId) =>
  (user?.blockedUsers || []).some(
    (blockedUser) =>
      String(blockedUser?._id || blockedUser) === String(targetUserId),
  );

const hasBlockedPostAuthor = (post, blockedAuthorIds = new Set()) => {
  const authorId = String(post?.author?._id || post?.author || "");
  const sharedAuthorId = String(
    post?.sharedFrom?.author?._id || post?.sharedFrom?.author || "",
  );

  return (
    (authorId && blockedAuthorIds.has(authorId)) ||
    (sharedAuthorId && blockedAuthorIds.has(sharedAuthorId))
  );
};

const normalizeEmail = (email) => email.trim().toLowerCase();

const defaultNotificationSettings = {
  posts: true,
  comments: true,
  friendRequests: true,
  messages: true,
  email: true,
};

const defaultPrivacySettings = {
  profileVisibility: "public",
  showEmail: false,
  showPhone: false,
  allowFriendRequests: true,
  allowMessagesFrom: "friends",
  searchableByEmail: true,
  searchableByPhone: true,
};

const pickBooleanSettings = (input = {}, allowedKeys) =>
  allowedKeys.reduce((result, key) => {
    if (typeof input[key] === "boolean") {
      result[key] = input[key];
    }

    return result;
  }, {});

const buildAccountSettingsResponse = (user, currentSessionId) => ({
  contact: {
    email: user.account?.email || "",
    phone: user.phone || "",
  },
  notificationSettings: {
    ...defaultNotificationSettings,
    ...(user.notificationSettings?.toObject?.() ||
      user.notificationSettings ||
      {}),
  },
  privacySettings: {
    ...defaultPrivacySettings,
    ...(user.privacySettings?.toObject?.() || user.privacySettings || {}),
  },
  accountStatus: user.account?.status || "active",
  sessions: (user.account?.loginSessions || [])
    .filter((session) => !session.revokedAt)
    .map((session) => ({
      sessionId: session.sessionId,
      userAgent: session.userAgent,
      ipAddress: session.ipAddress,
      createdAt: session.createdAt,
      lastActiveAt: session.lastActiveAt,
      isCurrent: session.sessionId === currentSessionId,
    }))
    .sort((a, b) => new Date(b.lastActiveAt) - new Date(a.lastActiveAt)),
});

const assertCurrentPassword = async (accountId, currentPassword) => {
  if (!currentPassword) {
    throwError(
      400,
      "CURRENT_PASSWORD_REQUIRED",
      "Current password is required",
    );
  }

  const account = await AuthRepository.findAccountById(accountId);
  if (!account) {
    throwError(404, "ACCOUNT_NOT_FOUND", "Account not found");
  }

  const accountWithPassword = await AuthRepository.findAccountByEmail(
    account.email,
    {
      includePassword: true,
    },
  );
  const passwordMatches = await bcrypt.compare(
    currentPassword,
    accountWithPassword.passwordHash,
  );

  if (!passwordMatches) {
    throwError(
      400,
      "INVALID_CURRENT_PASSWORD",
      "Current password is incorrect",
    );
  }

  return accountWithPassword;
};

async function editProfile(userId, updateData) {
  const user = await UserRepository.getUserById(userId);
  if (!user) throwError(404, "USER_NOT_FOUND", "User not found");
  if (updateData.email) {
    if (!user.account)
      throwError(400, "ACCOUNT_NOT_FOUND", "Account not found");

    const normalizedEmail = updateData.email.trim().toLowerCase();
    if (normalizedEmail !== user.account.email) {
      const existingAccount =
        await AuthRepository.findAccountByEmail(normalizedEmail);

      if (existingAccount) {
        throwError(
          400,
          "EMAIL_ALREADY_IN_USE",
          "Email is already in use by another user",
        );
      }
      await AuthRepository.updateAccountEmail(
        user.account._id,
        normalizedEmail,
      );
    }
    delete updateData.email;
  }
  if (Object.keys(updateData).length > 0) {
    await UserRepository.updateProfile(userId, updateData);
  }
  const updatedUser = await UserRepository.getUserById(userId);
  if (!updatedUser)
    throwError(500, "UPDATE_FAILED", "Failed to update user profile");

  return {
    success: true,
    message: "Profile updated successfully",
    data: buildProfileResponse(updatedUser),
  };
}

async function updateProfileImage(userId, field, imageUrl) {
  if (!["avatar", "coverImage"].includes(field)) {
    throwError(400, "INVALID_IMAGE_FIELD", "Invalid profile image field");
  }

  const user = await UserRepository.getUserById(userId);
  if (!user) throwError(404, "USER_NOT_FOUND", "User not found");

  await UserRepository.updateProfile(userId, { [field]: imageUrl });

  const updatedUser = await UserRepository.getUserById(userId);
  if (!updatedUser)
    throwError(500, "UPDATE_FAILED", "Failed to update user profile");

  return {
    success: true,
    message:
      field === "avatar"
        ? "Avatar uploaded successfully"
        : "Cover image uploaded successfully",
    data: buildProfileResponse(updatedUser),
  };
}

async function getMyProfile(userId) {
  const user = await UserRepository.getUserById(userId);
  if (!user) throwError(404, "USER_NOT_FOUND", "User not found");

  return {
    success: true,
    data: buildProfileResponse(user),
  };
}

async function getMyProfileByRole(userId, role) {
  const user = await UserRepository.getProfileByRole(userId, role);
  if (!user)
    throwError(
      403,
      "FORBIDDEN",
      "You do not have permission to access this resource",
    );

  return {
    success: true,
    data: buildProfileResponse(user),
  };
}

async function getOtherUserProfile(userId, myId) {
  const myUser = await UserRepository.getUserById(myId);
  if (!myUser) throwError(404, "USER_NOT_FOUND", "User not found");

  const user = await UserRepository.getOtherUserById(userId);
  if (!user) throwError(404, "USER_NOT_FOUND", "User not found");

  if (isUserBlocked(user, myId) || isUserBlocked(myUser, userId)) {
    throwError(403, "PROFILE_BLOCKED", "You cannot view this profile");
  }

  const userObj = user.toObject();
  userObj.relation = await FriendRequestService.getFriendRelation(
    userObj,
    myId,
  );

  const visibility = userObj.privacySettings?.profileVisibility || "public";
  const isFriend = userObj.relation === "friend";

  if (visibility === "private" || (visibility === "friends" && !isFriend)) {
    throwError(403, "PROFILE_PRIVATE", "This profile is private");
  }

  if (!userObj.privacySettings?.showPhone) {
    delete userObj.phone;
  }

  userObj.isFollowedByMe = (myUser.following || []).some(
    (followedUser) =>
      String(followedUser?._id || followedUser) === String(userId),
  );

  return userObj;
}

async function getAccountSettings(userId, currentSessionId) {
  const user = await UserRepository.getUserById(userId);
  if (!user) throwError(404, "USER_NOT_FOUND", "User not found");

  return {
    success: true,
    data: buildAccountSettingsResponse(user, currentSessionId),
  };
}

async function changePassword(userId, currentPassword, newPassword) {
  if (!newPassword || newPassword.length < 6) {
    throwError(
      400,
      "INVALID_PASSWORD",
      "Password must be at least 6 characters",
    );
  }

  const user = await UserRepository.getUserById(userId);
  if (!user?.account?._id)
    throwError(404, "ACCOUNT_NOT_FOUND", "Account not found");

  const account = await assertCurrentPassword(
    user.account._id,
    currentPassword,
  );
  const samePassword = await bcrypt.compare(newPassword, account.passwordHash);

  if (samePassword) {
    throwError(400, "PASSWORD_UNCHANGED", "New password must be different");
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await AuthRepository.updatePasswordHash(user.account._id, passwordHash);

  return {
    success: true,
    message: "Password changed successfully",
  };
}

async function updateContactInfo(
  userId,
  { email, phone, currentPassword },
  currentSessionId,
) {
  const user = await UserRepository.getUserById(userId);
  if (!user?.account?._id)
    throwError(404, "ACCOUNT_NOT_FOUND", "Account not found");

  const updateData = {};

  if (email !== undefined) {
    const normalizedEmail = normalizeEmail(email);

    if (normalizedEmail !== user.account.email) {
      await assertCurrentPassword(user.account._id, currentPassword);
      const existingAccount =
        await AuthRepository.findAccountByEmail(normalizedEmail);

      if (existingAccount) {
        throwError(400, "EMAIL_ALREADY_IN_USE", "Email is already in use");
      }

      await AuthRepository.updateAccountEmail(
        user.account._id,
        normalizedEmail,
      );
    }
  }

  if (phone !== undefined) {
    const normalizedPhone = String(phone || "").trim();

    if (normalizedPhone && !/^\d{10}$/.test(normalizedPhone)) {
      throwError(400, "INVALID_PHONE", "Phone number must contain 10 digits");
    }

    updateData.phone = normalizedPhone || null;
  }

  if (Object.keys(updateData).length > 0) {
    await UserRepository.updateProfile(userId, updateData);
  }

  const updatedUser = await UserRepository.getUserById(userId);

  return {
    success: true,
    message: "Contact information updated successfully",
    data: buildAccountSettingsResponse(updatedUser, currentSessionId),
  };
}

async function updateNotificationSettings(userId, settings, currentSessionId) {
  const updateData = pickBooleanSettings(
    settings,
    Object.keys(defaultNotificationSettings),
  );

  if (Object.keys(updateData).length === 0) {
    throwError(400, "NO_UPDATE_DATA", "No notification settings provided");
  }

  await UserRepository.updateProfile(userId, {
    $set: Object.entries(updateData).reduce((fields, [key, value]) => {
      fields[`notificationSettings.${key}`] = value;
      return fields;
    }, {}),
  });

  const updatedUser = await UserRepository.getUserById(userId);

  return {
    success: true,
    message: "Notification settings updated successfully",
    data: buildAccountSettingsResponse(updatedUser, currentSessionId),
  };
}

async function updatePrivacySettings(userId, settings, currentSessionId) {
  const updateData = pickBooleanSettings(settings, [
    "showEmail",
    "showPhone",
    "allowFriendRequests",
    "searchableByEmail",
    "searchableByPhone",
  ]);

  if (["public", "friends", "private"].includes(settings.profileVisibility)) {
    updateData.profileVisibility = settings.profileVisibility;
  }

  if (["everyone", "friends", "none"].includes(settings.allowMessagesFrom)) {
    updateData.allowMessagesFrom = settings.allowMessagesFrom;
  }

  if (Object.keys(updateData).length === 0) {
    throwError(400, "NO_UPDATE_DATA", "No privacy settings provided");
  }

  await UserRepository.updateProfile(userId, {
    $set: Object.entries(updateData).reduce((fields, [key, value]) => {
      fields[`privacySettings.${key}`] = value;
      return fields;
    }, {}),
  });

  const updatedUser = await UserRepository.getUserById(userId);

  return {
    success: true,
    message: "Privacy settings updated successfully",
    data: buildAccountSettingsResponse(updatedUser, currentSessionId),
  };
}

async function revokeSession(userId, sessionId, currentSessionId) {
  if (!sessionId) {
    throwError(400, "SESSION_ID_REQUIRED", "Session ID is required");
  }

  const user = await UserRepository.getUserById(userId);
  if (!user?.account?._id)
    throwError(404, "ACCOUNT_NOT_FOUND", "Account not found");

  if (sessionId === currentSessionId) {
    throwError(
      400,
      "CANNOT_REVOKE_CURRENT_SESSION",
      "Use logout to end current session",
    );
  }

  await AuthRepository.revokeLoginSession(user.account._id, sessionId);
  const updatedUser = await UserRepository.getUserById(userId);

  return {
    success: true,
    message: "Session revoked successfully",
    data: buildAccountSettingsResponse(updatedUser, currentSessionId),
  };
}

async function revokeOtherSessions(userId, currentSessionId) {
  const user = await UserRepository.getUserById(userId);
  if (!user?.account?._id)
    throwError(404, "ACCOUNT_NOT_FOUND", "Account not found");

  await AuthRepository.revokeOtherLoginSessions(
    user.account._id,
    currentSessionId,
  );
  const updatedUser = await UserRepository.getUserById(userId);

  return {
    success: true,
    message: "Other sessions revoked successfully",
    data: buildAccountSettingsResponse(updatedUser, currentSessionId),
  };
}

async function deactivateAccount(userId, currentPassword) {
  const user = await UserRepository.getUserById(userId);
  if (!user?.account?._id)
    throwError(404, "ACCOUNT_NOT_FOUND", "Account not found");

  await assertCurrentPassword(user.account._id, currentPassword);
  await AuthRepository.updateAccountFields(user.account._id, {
    status: "inactive",
  });
  await AuthRepository.revokeAllLoginSessions(user.account._id);
  await UserRepository.setUserOffline(userId, {
    isOnline: false,
    lastActive: new Date(),
  });

  return {
    success: true,
    message: "Account deactivated successfully",
  };
}

async function toggleFollowUser(userId, targetUserId) {
  if (String(userId) === String(targetUserId)) {
    throwError(400, "INVALID_FOLLOW_TARGET", "You cannot follow yourself");
  }

  const [user, targetUser] = await Promise.all([
    UserRepository.getUserById(userId),
    UserRepository.getUserById(targetUserId),
  ]);

  if (!user || !targetUser) {
    throwError(404, "USER_NOT_FOUND", "User not found");
  }

  if (isUserBlocked(user, targetUserId) || isUserBlocked(targetUser, userId)) {
    throwError(403, "PROFILE_BLOCKED", "You cannot follow this user");
  }

  const isFollowing = (user.following || []).some(
    (followedUser) =>
      String(followedUser?._id || followedUser) === String(targetUserId),
  );

  const isFriend = (user.friends || []).some(
    (friend) => String(friend?._id || friend) === String(targetUserId),
  );

  if (isFriend) {
    return {
      isFollowing: true,
      userId: targetUserId,
      locked: true,
    };
  }

  await Promise.all([
    UserRepository.updateProfile(
      userId,
      isFollowing
        ? { $pull: { following: targetUserId } }
        : { $addToSet: { following: targetUserId } },
    ),
    UserRepository.updateProfile(
      targetUserId,
      isFollowing
        ? { $pull: { followers: userId } }
        : { $addToSet: { followers: userId } },
    ),
  ]);

  return {
    isFollowing: !isFollowing,
    userId: targetUserId,
  };
}

async function blockUser(userId, blockedUserId) {
  if (String(userId) === String(blockedUserId)) {
    throwError(400, "INVALID_BLOCK_TARGET", "You cannot block yourself");
  }

  const [user, blockedUser] = await Promise.all([
    UserRepository.getUserById(userId),
    UserRepository.getUserById(blockedUserId),
  ]);

  if (!user || !blockedUser) {
    throwError(404, "USER_NOT_FOUND", "User not found");
  }

  await UserRepository.blockUser(userId, blockedUserId);
  await UserRepository.removeUsersFromFriends(userId, blockedUserId);
  await FriendRequestRepo.deleteRequestBetweenUsers(userId, blockedUserId);

  const updatedUser = await UserRepository.getUserById(userId);

  return {
    success: true,
    message: "User blocked successfully",
    data: buildProfileResponse(updatedUser),
  };
}

async function unblockUser(userId, blockedUserId) {
  const [user, blockedUser] = await Promise.all([
    UserRepository.getUserById(userId),
    UserRepository.getUserById(blockedUserId),
  ]);

  if (!user || !blockedUser) {
    throwError(404, "USER_NOT_FOUND", "User not found");
  }

  await UserRepository.unblockUser(userId, blockedUserId);
  const updatedUser = await UserRepository.getUserById(userId);

  return {
    success: true,
    message: "User unblocked successfully",
    data: buildProfileResponse(updatedUser),
  };
}

async function getBlockedUsers(userId) {
  const user = await UserRepository.getUserById(userId);
  if (!user) throwError(404, "USER_NOT_FOUND", "User not found");

  return {
    success: true,
    data: buildProfileResponse(user).blockedUsers,
  };
}

async function searchUsers(keyword, page, limit, myId) {
  const viewer = await UserRepository.getUserById(myId);
  const usersBlockingViewer = await UserRepository.findUsersBlocking(myId);
  const blockedIds = [
    ...(viewer?.blockedUsers || []).map((user) => String(user?._id || user)),
    ...usersBlockingViewer.map((user) => String(user?._id || user)),
  ];

  let queryCondition = {
    _id: {
      $ne: myId,
      $nin: blockedIds,
    },
  };
  const isPhone = /^\d{10, 11}$/.test(keyword);

  if (isPhone) {
    queryCondition.phone = keyword;
  } else {
    queryCondition.searchName = { $regex: keyword, $options: "i" };
  }

  console.log(`searchUsers - queryCondition:`, queryCondition);
  const skip = (page - 1) * limit;
  const users = await UserRepository.findUsers(queryCondition, skip, limit);
  const total = await UserRepository.countUsers(queryCondition);
  // console.log(`searchUsers - keyword: ${keyword}, isPhone: ${isPhone}, total found: ${total}`);
  const usersWithRelation = await Promise.all(
    users.map(async (user) => {
      const relation = await FriendRequestService.getFriendRelation(user, myId);

      return {
        id: user._id,
        fullName: user.fullName,
        avatar: user.avatar,
        isFriend: relation === "friend",
        relation,
      };
    }),
  );

  const relationPriority = {
    friend: 3,
    received_request: 2,
    sent_request: 1,
    none: 0,
  };

  usersWithRelation.sort(
    (a, b) => relationPriority[b.relation] - relationPriority[a.relation],
  );

  return {
    data: usersWithRelation,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
    },
  };
}

async function logout(userId, sessionId) {
  if (sessionId) {
    const user = await UserRepository.getUserById(userId);
    if (user?.account?._id) {
      await AuthRepository.revokeLoginSession(user.account._id, sessionId);
    }
  }

  await UserRepository.setUserOffline(userId, {
    isOnline: false,
    lastActive: new Date(),
  });
}

async function getUsersWithRelationStatus(myId, rawUsers) {
  const myIdStr = myId.toString();
  const foundUserIds = rawUsers.map((u) => u._id.toString());

  const pendingRequests = await FriendRequestService.getPendingRequests(
    myIdStr,
    foundUserIds,
  );

  const requestMap = new Map();
  pendingRequests.forEach((req) => {
    const senderStr = req.sender.toString();
    const receiverStr = req.receiver.toString();
    const key = `${senderStr}_${receiverStr}`;
    requestMap.set(key, true);
  });

  const myFriendIds = new Set();
  rawUsers.forEach((u) => {
    const hasMeInFriends = u.friends?.some((fId) => fId.toString() === myIdStr);
    if (hasMeInFriends) {
      myFriendIds.add(u._id.toString());
    }
  });

  const mappedUsers = rawUsers.map((user) => {
    const userIdStr = user._id.toString();
    let relationStatus = "none";

    if (myFriendIds.has(userIdStr)) {
      relationStatus = "friend";
    } else {
      const sentKey = `${myIdStr}_${userIdStr}`;
      const receivedKey = `${userIdStr}_${myIdStr}`;

      if (requestMap.has(sentKey)) {
        relationStatus = "sent_request";
      } else if (requestMap.has(receivedKey)) {
        relationStatus = "received_request";
      }
    }

    return {
      id: userIdStr,
      fullName: user.fullName,
      avatar: user.avatar,
      relationStatus,
    };
  });

  const relationPriority = {
    friend: 4,
    received_request: 3,
    sent_request: 2,
    none: 1,
  };

  mappedUsers.sort(
    (a, b) =>
      relationPriority[b.relationStatus] - relationPriority[a.relationStatus],
  );

  return mappedUsers;
}

function buildSearchPostFilter({
  time,
  friends,
  media,
  myId,
  viewerFriendIds,
}) {
  const filter = {};

  if (time && time !== "any") {
    const now = new Date();
    const daysByTime = {
      day: 1,
      week: 7,
      month: 30,
      year: 365,
    };
    const days = daysByTime[time];

    if (days) {
      filter.createdAt = {
        $gte: new Date(now.getTime() - days * 24 * 60 * 60 * 1000),
      };
    }
  }

  if (friends === "friends" && myId) {
    filter.author = { $in: viewerFriendIds };
  }

  if (media === "photo") {
    filter.media = { $elemMatch: { type: "image" } };
  } else if (media === "video") {
    filter.media = { $elemMatch: { type: "video" } };
  } else if (media === "any_media") {
    filter["media.0"] = { $exists: true };
  }

  return filter;
}

function extractHashtags(posts, q, limit) {
  const normalizedQuery = q.replace(/^#/, "").toLowerCase();
  const tagMap = new Map();

  posts.forEach((post) => {
    const matches = String(post.content || "").match(/#[\p{L}\p{N}_]+/gu) || [];

    matches.forEach((tag) => {
      const cleanTag = tag.slice(1);
      if (!cleanTag.toLowerCase().includes(normalizedQuery)) return;

      const key = cleanTag.toLowerCase();
      const current = tagMap.get(key) || {
        id: key,
        tag: cleanTag,
        count: 0,
      };

      tagMap.set(key, {
        ...current,
        count: current.count + 1,
      });
    });
  });

  return [...tagMap.values()]
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
    .slice(0, limit);
}

async function globalSearch({
  q,
  type = "all",
  limit = 10,
  myId,
  time = "any",
  friends = "all",
  media = "all",
}) {
  const currentLimit = parseInt(limit, 10) || 10;
  const keyword = removeVietnameseTones(q).toLowerCase();
  const viewer = myId ? await UserRepository.findById(myId) : null;
  const viewerFriendIds = [...getFriendIdSet(viewer)];
  const usersBlockingViewer = myId
    ? await UserRepository.findUsersBlocking(myId)
    : [];
  const blockedAuthorIds = new Set([
    ...(viewer?.blockedUsers || []).map((user) => String(user?._id || user)),
    ...usersBlockingViewer.map((user) => String(user?._id || user)),
  ]);
  const privacyFilter = buildPrivacyMongoFilter(myId, viewerFriendIds);
  const searchPostFilter = buildSearchPostFilter({
    time,
    friends,
    media,
    myId,
    viewerFriendIds,
  });
  const postFilter = {
    ...privacyFilter,
    ...searchPostFilter,
    author: { $nin: [...blockedAuthorIds] },
  };

  if (searchPostFilter.author?.$in) {
    postFilter.author = {
      $in: searchPostFilter.author.$in.filter(
        (friendId) => !blockedAuthorIds.has(String(friendId)),
      ),
    };
  }

  if (type === "all") {
    const [rawUsers, groups, posts] = await Promise.all([
      UserRepository.searchUsers({ keyword, limit: currentLimit, myId }),
      GroupRepository.searchGroups({ keyword, limit: currentLimit }),
      PostRepository.searchPosts({
        keyword: q,
        limit: currentLimit,
        filter: postFilter,
      }),
    ]);

    const mappedUsers = await getUsersWithRelationStatus(myId, rawUsers);
    const visiblePosts = posts.filter(
      (post) =>
        !hasBlockedPostAuthor(post, blockedAuthorIds) &&
        canViewPostWithSharedSource(post, myId, viewerFriendIds),
    );

    return {
      success: true,
      type: "all",
      data: {
        users: mappedUsers,
        groups,
        posts: visiblePosts,
        hashtags: extractHashtags(visiblePosts, q, currentLimit),
      },
      nextLimit: currentLimit + 10,
    };
  }

  let resultData;

  switch (type) {
    case "user": {
      const rawUsers = await UserRepository.searchUsers({
        keyword,
        myId,
        limit: currentLimit,
      });
      resultData = await getUsersWithRelationStatus(myId, rawUsers);
      break;
    }

    case "group": {
      const rawGroups = await GroupRepository.searchGroups({
        keyword,
        limit: currentLimit,
      });
      resultData = rawGroups;
      break;
    }

    case "post": {
      const rawPosts = await PostRepository.searchPosts({
        keyword: q,
        limit: currentLimit,
        filter: postFilter,
      });
      resultData = rawPosts.filter(
        (post) =>
          !hasBlockedPostAuthor(post, blockedAuthorIds) &&
          canViewPostWithSharedSource(post, myId, viewerFriendIds),
      );
      break;
    }

    case "hashtag": {
      const rawPosts = await PostRepository.searchPosts({
        keyword: q.replace(/^#/, ""),
        limit: Math.max(currentLimit * 3, 30),
        filter: postFilter,
      });
      const visiblePosts = rawPosts.filter(
        (post) =>
          !hasBlockedPostAuthor(post, blockedAuthorIds) &&
          canViewPostWithSharedSource(post, myId, viewerFriendIds),
      );
      resultData = extractHashtags(visiblePosts, q, currentLimit);
      break;
    }

    default: {
      const error = new Error("Invalid search type.");
      error.statusCode = 400;
      throw error;
    }
  }

  return {
    success: true,
    type,
    data: resultData,
    nextLimit: currentLimit + 10,
  };
}

module.exports = {
  editProfile,
  getMyProfile,
  getAccountSettings,
  changePassword,
  updateContactInfo,
  updateNotificationSettings,
  updatePrivacySettings,
  revokeSession,
  revokeOtherSessions,
  deactivateAccount,
  updateProfileImage,
  globalSearch,
  getMyProfileByRole,
  getOtherUserProfile,
  logout,
  searchUsers,
  blockUser,
  unblockUser,
  getBlockedUsers,
  toggleFollowUser,
};

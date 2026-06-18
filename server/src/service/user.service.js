const UserRepository = require("../repo/user.repository");
const AuthRepository = require("../repo/auth.repository");
const GroupRepository = require("../repo/group.repository");
const PostRepository = require("../repo/post.repository");
const FriendRequestService = require("./friendRequest.service");
const { removeVietnameseTones } = require("../utils/stringUtil");

// Hàm Helper tạo lỗi chuẩn Node.js (Giữ được Stack Trace để dễ debug sau này)
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
  blockedUsers: (user.blockedUsers || []).map((blockedUser) => ({
    id: blockedUser?._id?.toString?.() || blockedUser?.toString?.() || blockedUser,
    fullName: blockedUser?.fullName || "Unknown",
    avatar: blockedUser?.avatar || null,
  })),
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const isUserBlocked = (user, targetUserId) =>
  (user?.blockedUsers || []).some(
    (blockedUser) => String(blockedUser?._id || blockedUser) === String(targetUserId),
  );

async function editProfile(userId, updateData) {
    const user = await UserRepository.getUserById(userId);
    if (!user) throwError(404, "USER_NOT_FOUND", "User not found");

    // Xử lý cập nhật Email (Nằm ở collection Account)
    if (updateData.email) {
        if (!user.account)
            throwError(400, "ACCOUNT_NOT_FOUND", "Account not found");

        const normalizedEmail = updateData.email.trim().toLowerCase();

        // TỐI ƯU LOGIC: Chỉ query DB check trùng lặp nếu người dùng THỰC SỰ nhập email mới
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

            // Nếu không trùng với ai, tiến hành update
            await AuthRepository.updateAccountEmail(
                user.account._id,
                normalizedEmail,
            );
        }

        // Phải xóa email khỏi updateData để không bị ném nhầm sang update bên bảng User
        delete updateData.email;
    }

    // Xử lý cập nhật các trường còn lại (Nằm ở collection User)
    if (Object.keys(updateData).length > 0) {
        await UserRepository.updateProfile(userId, updateData);
    }

    // Lấy lại User sau khi update để có data mới nhất (Bao gồm cả account email mới nếu có)
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

    return userObj;
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
  // 1. Kiểm tra keyword là sđt hay tên
  let queryCondition = { _id: { $ne: myId } };
  const isPhone = /^\d{10, 11}$/.test(keyword);

  if (isPhone) {
    queryCondition.phone = keyword;
  } else {
    queryCondition.searchName = { $regex: keyword, $options: "i" };
  }

  console.log(`searchUsers - queryCondition:`, queryCondition);

  //2. Phân trang
  const skip = (page - 1) * limit;

  // 3. Lấy data
  const users = await UserRepository.findUsers(queryCondition, skip, limit);
  const total = await UserRepository.countUsers(queryCondition);
  // console.log(`searchUsers - keyword: ${keyword}, isPhone: ${isPhone}, total found: ${total}`);

  // 4. Quan hệ
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

async function logout(userId) {
    await UserRepository.setUserOffline(userId, {
        isOnline: false,
        lastActive: new Date(),
    });
}

async function getUsersWithRelationStatus(myId, rawUsers) {
    const myIdStr = myId.toString();
    const foundUserIds = rawUsers.map(u => u._id.toString());
    
    const pendingRequests = await FriendRequestService.getPendingRequests(myIdStr, foundUserIds);

    const requestMap = new Map();
    pendingRequests.forEach(req => {
        const senderStr = req.sender.toString();
        const receiverStr = req.receiver.toString();
        const key = `${senderStr}_${receiverStr}`;
        requestMap.set(key, true);
    });

    const myFriendIds = new Set();
    rawUsers.forEach(u => {
        const hasMeInFriends = u.friends?.some(fId => fId.toString() === myIdStr);
        if (hasMeInFriends) {
            myFriendIds.add(u._id.toString());
        }
    });

    const mappedUsers = rawUsers.map(user => {
        const userIdStr = user._id.toString();
        let relationStatus = 'none';

        if (myFriendIds.has(userIdStr)) {
            relationStatus = 'friend';
        } else {
            const sentKey = `${myIdStr}_${userIdStr}`;
            const receivedKey = `${userIdStr}_${myIdStr}`;

            if (requestMap.has(sentKey)) {
                relationStatus = 'sent_request';
            } else if (requestMap.has(receivedKey)) {
                relationStatus = 'received_request';
            }
        }

        return {
            id: userIdStr,
            fullName: user.fullName,
            avatar: user.avatar,
            relationStatus
        };
    });

    const relationPriority = {
        'friend': 4,
        'received_request': 3,
        'sent_request': 2,
        'none': 1
    };

    mappedUsers.sort((a, b) =>
        relationPriority[b.relationStatus] - relationPriority[a.relationStatus]
    );

    return mappedUsers;
}

async function globalSearch({ q, type = "all", limit = 10, myId }) {
    const currentLimit = parseInt(limit, 10) || 10;
    const keyword = removeVietnameseTones(q).toLowerCase();

    if (type === "all") {
        const [rawUsers, groups, posts] = await Promise.all([
            UserRepository.searchUsers({ keyword, limit: currentLimit, myId }),
            GroupRepository.searchGroups({ keyword, limit: currentLimit }),
            PostRepository.searchPosts({ keyword: q, limit: currentLimit }),
        ])

        const mappedUsers = await getUsersWithRelationStatus(myId, rawUsers);

        return {
            success: true,
            type: 'all',
            data: {
                users: mappedUsers,
                groups,
                posts,
            },
            nextLimit: currentLimit + 10
        };
    }

    let resultData;

    switch (type) {
        case 'user': {
            const rawUsers = await UserRepository.searchUsers({ keyword, myId, limit: currentLimit });
            resultData = await getUsersWithRelationStatus(myId, rawUsers);
            break;
        }

        case 'group': {
            const rawGroups = await GroupRepository.searchGroups({ keyword, limit: currentLimit });
            resultData = rawGroups;
            break;
        }

        case 'post': {
            const rawPosts = await PostRepository.searchPosts({ keyword: q, limit: currentLimit });
            resultData = rawPosts;
            break;
        }

        default: {
            const error = new Error('Loại tìm kiếm không hợp lệ!');
            error.statusCode = 400;
            throw error;
        }
    }

    return {
        success: true,
        type,
        data: resultData,
        nextLimit: currentLimit + 10
    };
}


module.exports = {
  editProfile,
  getMyProfile,
  updateProfileImage,
  globalSearch,
  getMyProfileByRole,
  getOtherUserProfile,
  logout,
  searchUsers,
  blockUser,
  unblockUser,
  getBlockedUsers,
};

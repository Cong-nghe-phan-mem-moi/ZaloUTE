const UserRepository = require('../repo/user.repository');
const AuthRepository = require('../repo/auth.repository');
const FriendRequestRepo = require('../repo/friendRequest.repository');

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
  bio: user.bio,
  dateOfBirth: user.dateOfBirth,
  gender: user.gender,
  address: user.address,
  isOnline: user.isOnline,
  lastActive: user.lastActive,
  friendsCount: user.friends?.length || 0,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

async function editProfile(userId, updateData) {
  const user = await UserRepository.getUserById(userId);
  if (!user) throwError(404, 'USER_NOT_FOUND', 'User not found');

  // Xử lý cập nhật Email (Nằm ở collection Account)
  if (updateData.email) {
    if (!user.account) throwError(400, 'ACCOUNT_NOT_FOUND', 'Account not found');

    const normalizedEmail = updateData.email.trim().toLowerCase();
    
    // TỐI ƯU LOGIC: Chỉ query DB check trùng lặp nếu người dùng THỰC SỰ nhập email mới
    if (normalizedEmail !== user.account.email) {
      const existingAccount = await AuthRepository.findAccountByEmail(normalizedEmail);
      
      if (existingAccount) {
        throwError(400, 'EMAIL_ALREADY_IN_USE', 'Email is already in use by another user');
      }
      
      // Nếu không trùng với ai, tiến hành update
      await AuthRepository.updateAccountEmail(user.account._id, normalizedEmail);
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
  if (!updatedUser) throwError(500, 'UPDATE_FAILED', 'Failed to update user profile');

  return {
    success: true,
    message: 'Profile updated successfully',
    data: buildProfileResponse(updatedUser),
  };
}

async function getMyProfile(userId) { 
  const user = await UserRepository.getUserById(userId);
  if (!user) throwError(404, 'USER_NOT_FOUND', 'User not found');

  return {
    success: true,
    data: buildProfileResponse(user),
  };
}

async function getMyProfileByRole(userId, role) {
  const user = await UserRepository.getProfileByRole(userId, role);
  if (!user) throwError(403, 'FORBIDDEN', 'You do not have permission to access this resource');

  return {
    success: true,
    data: buildProfileResponse(user),
  };
}

async function getOtherUserProfile(userId, myId) {
  const user = await UserRepository.getOtherUserById(userId);
  if (!user) throwError(404, 'USER_NOT_FOUND', 'User not found');
  const isFriend = user.friends.some(friendId => friendId.equals(myId));

  const userObj = user.toObject();
  userObj.relation = isFriend ? 'friend' : 'none';

  return userObj;
}

async function searchUsers(keyword, page, limit, myId) {
  // 1. Kiểm tra keyword là sđt hay tên
  let queryCondition = { _id: {$ne: myId} };
  const isPhone = /^\d{10, 11}$/.test(keyword);
  
  if (isPhone) {
    queryCondition.phone = keyword;
  } else {
    queryCondition.searchName = {$regex: keyword, $options: 'i'};
  }

  console.log(`searchUsers - queryCondition:`, queryCondition);

  //2. Phân trang
  const skip = (page - 1) * limit;

  // 3. Lấy data
  const users = await UserRepository.findUsers(queryCondition, skip, limit);
  const total = await UserRepository.countUsers(queryCondition);
  // console.log(`searchUsers - keyword: ${keyword}, isPhone: ${isPhone}, total found: ${total}`);

  // 4. Quan hệ 
  let usersWithRelation = users.map(user => {
    const isFriend = user.friends.some(friendId => friendId.equals(myId));

    return {
      id: user._id,
      fullName: user.fullName,
      avatar: user.avatar,
      isFriend: isFriend,
    }
  })
  usersWithRelation.sort((a, b) => b.isFriend - a.isFriend);
  
  return {
    data: usersWithRelation,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
    }
  };
}

async function logout(userId) {
  await UserRepository.setUserOffline(userId, { isOnline: false, lastActive: new Date() });
}

module.exports = {
  editProfile,
  getMyProfile,
  searchUsers,
  getMyProfileByRole,
  getOtherUserProfile,
  logout
};
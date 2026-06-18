const GroupRepository = require('../repo/group.repository');

function throwCustomError(statusCode, message, code) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  throw error;
}

function getDocumentId(value) {
  return value?._id || value?.id || value;
}

function includesUserId(values = [], userId) {
  return values.some((value) => getDocumentId(value)?.toString() === userId.toString());
}

async function createNewGroup(
  creatorId,
  { name, description, avatar, isPrivate, invitedUserIds },
) {
  if (typeof name !== 'string' || name.trim() === '') {
    throwCustomError(400, 'Tên nhóm không được để trống', 'VALIDATION_ERROR');
  }

  const groupData = {
    name: name.trim(),
    description: description ? description.trim() : '',
    avatar: avatar || 'https://cdn-icons-png.flaticon.com/512/166/166258.png',
    creator: creatorId,
    admins: [creatorId],
    members: [creatorId],
    isPrivate: !!isPrivate,
    pendingInvites: Array.isArray(invitedUserIds) ? invitedUserIds : [],
    pendingRequests: [],
  };

  return await GroupRepository.createGroup(groupData);
}

async function getGroups(userId) {
  return await GroupRepository.getGroupsByUserId(userId);
}

async function getGroupDetail(userId, groupId) {
  const group = await GroupRepository.findGroupDetailById(groupId);
  if (!group) throwCustomError(404, 'Không tìm thấy nhóm', 'GROUP_NOT_FOUND');

  const isCurrentUserMember = includesUserId(group.members, userId);
  const isCurrentUserAdmin = includesUserId(group.admins, userId);
  const hasPendingInvite = includesUserId(group.pendingInvites, userId);
  const hasPendingRequest = includesUserId(group.pendingRequests, userId);

  if (group.isPrivate && !isCurrentUserMember && !isCurrentUserAdmin) {
    throwCustomError(403, 'Bạn không có quyền xem nhóm riêng tư này', 'FORBIDDEN');
  }

  return {
    ...group,
    isCurrentUserMember,
    isCurrentUserAdmin,
    hasPendingInvite,
    hasPendingRequest,
  };
}

async function updateGroupInfo(userId, groupId, updateData) {
  const group = await GroupRepository.findGroupById(groupId);
  if (!group) throwCustomError(404, 'Không tìm thấy nhóm', 'GROUP_NOT_FOUND');

  const isAdmin = group.admins.some((id) => id.toString() === userId.toString());
  if (!isAdmin) {
    throwCustomError(403, 'Bạn không có quyền chỉnh sửa nhóm này', 'FORBIDDEN');
  }

  if (
    updateData.name !== undefined
    && (typeof updateData.name !== 'string' || updateData.name.trim() === '')
  ) {
    throwCustomError(400, 'Tên nhóm không được để trống', 'VALIDATION_ERROR');
  }

  const allowedFields = ['name', 'description', 'avatar', 'isPrivate'];
  const safeUpdateData = {};

  allowedFields.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(updateData, field)) {
      safeUpdateData[field] = typeof updateData[field] === 'string'
        ? updateData[field].trim()
        : updateData[field];
    }
  });

  return await GroupRepository.updateGroupInfo(groupId, safeUpdateData);
}

async function inviteToGroup(userId, groupId, targetUserIds) {
  if (!Array.isArray(targetUserIds) || targetUserIds.length === 0) {
    throwCustomError(
      400,
      'Danh sách người được mời phải là một mảng hợp lệ',
      'VALIDATION_ERROR',
    );
  }

  const group = await GroupRepository.findGroupById(groupId);
  if (!group) throwCustomError(404, 'Không tìm thấy nhóm', 'GROUP_NOT_FOUND');

  const isAdmin = group.admins.some((id) => id.toString() === userId.toString());
  if (!isAdmin) {
    throwCustomError(403, 'Bạn không có quyền Admin để mời người khác vào nhóm này', 'FORBIDDEN');
  }

  const validInvites = targetUserIds.filter(
    (targetId) => !group.members.some((memberId) => memberId.toString() === targetId.toString()),
  );

  if (validInvites.length === 0) {
    throwCustomError(
      400,
      'Tất cả người dùng được chọn đều đã là thành viên của nhóm',
      'VALIDATION_ERROR',
    );
  }

  return await GroupRepository.addPendingInvites(groupId, validInvites);
}

async function acceptGroupInvitation(userId, groupId) {
  const group = await GroupRepository.findGroupById(groupId);
  if (!group) throwCustomError(404, 'Không tìm thấy nhóm', 'GROUP_NOT_FOUND');

  const hasInvite = group.pendingInvites.some((id) => id.toString() === userId.toString());
  if (!hasInvite) {
    throwCustomError(400, 'Bạn không có lời mời tham gia nhóm này', 'INVITE_NOT_FOUND');
  }

  return await GroupRepository.removeInviteAndAddMember(groupId, userId);
}
 
async function approveJoinRequest(adminId, groupId, targetUserId) {
  const group = await GroupRepository.findGroupById(groupId);
  if (!group) throwCustomError(404, 'Không tìm thấy nhóm', 'GROUP_NOT_FOUND');

  const isAdmin = group.admins.some((id) => id.toString() === adminId.toString());
  if (!isAdmin) {
    throwCustomError(403, 'Chỉ có Admin mới có quyền duyệt thành viên', 'FORBIDDEN');
  }

  const hasRequest = group.pendingRequests.some((id) => id.toString() === targetUserId.toString());
  if (!hasRequest) {
    throwCustomError(400, 'Người dùng này không nằm trong danh sách xin vào nhóm', 'REQUEST_NOT_FOUND');
  }

  return await GroupRepository.removeRequestAndAddMember(groupId, targetUserId);
}

async function assignAdmin(adminId, groupId, targetUserId) {
  const group = await GroupRepository.findGroupById(groupId);
  if (!group) throwCustomError(404, 'Không tìm thấy nhóm', 'GROUP_NOT_FOUND');

  const isAdmin = group.admins.some((id) => id.toString() === adminId.toString());
  if (!isAdmin) {
    throwCustomError(403, 'Chỉ có Admin mới có quyền bổ nhiệm Admin mới', 'FORBIDDEN');
  }

  const isMember = group.members.some((id) => id.toString() === targetUserId.toString());
  if (!isMember) {
    throwCustomError(400, 'Người này phải là thành viên nhóm trước khi lên làm Admin', 'VALIDATION_ERROR');
  }

  const isAlreadyAdmin = group.admins.some((id) => id.toString() === targetUserId.toString());
  if (isAlreadyAdmin) {
    throwCustomError(400, 'Người này đã là Admin từ trước rồi', 'VALIDATION_ERROR');
  }

  return await GroupRepository.addAdmin(groupId, targetUserId);
}

module.exports = {
  createNewGroup,
  getGroups,
  getGroupDetail,
  updateGroupInfo,
  inviteToGroup,
  acceptGroupInvitation,
  approveJoinRequest,
  assignAdmin,
};

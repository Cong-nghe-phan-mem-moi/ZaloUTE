const GroupRepository = require('../repositories/group.repository');
const Comment = require('../models/comment.model');
const Post = require('../models/post.model');

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

async function getAdminGroup(adminId, groupId) {
  const group = await GroupRepository.findGroupById(groupId);
  if (!group) throwCustomError(404, 'Group not found', 'GROUP_NOT_FOUND');

  const isAdmin = includesUserId(group.admins, adminId);
  if (!isAdmin) {
    throwCustomError(403, 'You do not have admin permission in this group', 'FORBIDDEN');
  }

  return group;
}

async function createNewGroup(
  creatorId,
  { name, description, avatar, isPrivate, invitedUserIds },
) {
  if (typeof name !== 'string' || name.trim() === '') {
    throwCustomError(400, 'Group name cannot be empty', 'VALIDATION_ERROR');
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

async function getGroupInvitations(userId) {
  return await GroupRepository.getInvitationsByUserId(userId);
}

async function getGroupDetail(userId, groupId) {
  const group = await GroupRepository.findGroupDetailById(groupId);
  if (!group) throwCustomError(404, 'Group not found', 'GROUP_NOT_FOUND');

  const isCurrentUserMember = includesUserId(group.members, userId);
  const isCurrentUserAdmin = includesUserId(group.admins, userId);
  const hasPendingInvite = includesUserId(group.pendingInvites, userId);
  const hasPendingRequest = includesUserId(group.pendingRequests, userId);

  if (group.isPrivate && !isCurrentUserMember && !isCurrentUserAdmin && !hasPendingInvite) {
    throwCustomError(403, 'You do not have permission to view this private group', 'FORBIDDEN');
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
  if (!group) throwCustomError(404, 'Group not found', 'GROUP_NOT_FOUND');

  const isAdmin = group.admins.some((id) => id.toString() === userId.toString());
  if (!isAdmin) {
    throwCustomError(403, 'You do not have permission to edit this group', 'FORBIDDEN');
  }

  if (
    updateData.name !== undefined
    && (typeof updateData.name !== 'string' || updateData.name.trim() === '')
  ) {
    throwCustomError(400, 'Group name cannot be empty', 'VALIDATION_ERROR');
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

async function deleteGroup(adminId, groupId) {
  await getAdminGroup(adminId, groupId);

  const groupPosts = await Post.find({ group: groupId }).select('_id').lean();
  const postIds = groupPosts.map((post) => post._id);

  if (postIds.length > 0) {
    await Comment.deleteMany({ post: { $in: postIds } });
    await Post.deleteMany({ _id: { $in: postIds } });
  }

  const deletedGroup = await GroupRepository.deleteGroup(groupId);
  if (!deletedGroup) {
    throwCustomError(404, 'Group not found', 'GROUP_NOT_FOUND');
  }

  return deletedGroup;
}

async function inviteToGroup(userId, groupId, targetUserIds) {
  if (!Array.isArray(targetUserIds) || targetUserIds.length === 0) {
    throwCustomError(
      400,
      'Invited users must be a valid array',
      'VALIDATION_ERROR',
    );
  }

  const group = await GroupRepository.findGroupById(groupId);
  if (!group) throwCustomError(404, 'Group not found', 'GROUP_NOT_FOUND');

  const isAdmin = group.admins.some((id) => id.toString() === userId.toString());
  if (!isAdmin) {
    throwCustomError(403, 'You need admin permission to invite users to this group', 'FORBIDDEN');
  }

  const validInvites = targetUserIds.filter(
    (targetId) => !group.members.some((memberId) => memberId.toString() === targetId.toString()),
  );

  if (validInvites.length === 0) {
    throwCustomError(
      400,
      'All selected users are already group members',
      'VALIDATION_ERROR',
    );
  }

  return await GroupRepository.addPendingInvites(groupId, validInvites);
}

async function acceptGroupInvitation(userId, groupId) {
  const group = await GroupRepository.findGroupById(groupId);
  if (!group) throwCustomError(404, 'Group not found', 'GROUP_NOT_FOUND');

  const hasInvite = group.pendingInvites.some((id) => id.toString() === userId.toString());
  if (!hasInvite) {
    throwCustomError(400, 'You do not have an invitation to this group', 'INVITE_NOT_FOUND');
  }

  const result = await GroupRepository.removeInviteAndAddMember(groupId, userId);
  if (!result.modifiedCount) {
    throwCustomError(409, 'Unable to update invitation. Please reload the group and try again', 'INVITE_UPDATE_FAILED');
  }

  return result;
}

async function rejectGroupInvitation(userId, groupId) {
  const group = await GroupRepository.findGroupById(groupId);
  if (!group) throwCustomError(404, 'Group not found', 'GROUP_NOT_FOUND');

  const hasInvite = group.pendingInvites.some((id) => id.toString() === userId.toString());
  if (!hasInvite) {
    throwCustomError(400, 'You do not have an invitation to this group', 'INVITE_NOT_FOUND');
  }

  const result = await GroupRepository.removePendingInvite(groupId, userId);
  if (!result.modifiedCount) {
    throwCustomError(409, 'Unable to reject invitation. Please reload the group and try again', 'INVITE_REJECT_FAILED');
  }

  return result;
}

async function requestJoinGroup(userId, groupId) {
  const group = await GroupRepository.findGroupById(groupId);
  if (!group) throwCustomError(404, 'Group not found', 'GROUP_NOT_FOUND');

  if (includesUserId(group.members, userId) || includesUserId(group.admins, userId)) {
    throwCustomError(409, 'You are already a member of this group', 'ALREADY_MEMBER');
  }

  if (includesUserId(group.pendingRequests, userId)) {
    throwCustomError(409, 'Your join request is waiting for admin approval', 'REQUEST_ALREADY_PENDING');
  }

  if (includesUserId(group.pendingInvites, userId)) {
    throwCustomError(409, 'You already have an invitation to this group. Please accept it', 'INVITE_ALREADY_PENDING');
  }

  const result = await GroupRepository.addPendingRequest(groupId, userId);
  if (!result.modifiedCount) {
    throwCustomError(409, 'Unable to send join request. Please reload and try again', 'REQUEST_JOIN_FAILED');
  }

  return result;
}

async function cancelGroupInvitation(adminId, groupId, targetUserId) {
  if (!targetUserId) {
    throwCustomError(400, 'Missing user to cancel invitation', 'VALIDATION_ERROR');
  }

  const group = await getAdminGroup(adminId, groupId);
  const hasInvite = includesUserId(group.pendingInvites, targetUserId);
  if (!hasInvite) {
    throwCustomError(400, 'This user is not in the pending invitation list', 'INVITE_NOT_FOUND');
  }

  const result = await GroupRepository.removePendingInvite(groupId, targetUserId);
  if (!result.modifiedCount) {
    throwCustomError(409, 'Unable to cancel invitation. Please reload the group and try again', 'INVITE_CANCEL_FAILED');
  }

  return result;
}
 
async function approveJoinRequest(adminId, groupId, targetUserId) {
  if (!targetUserId) {
    throwCustomError(400, 'Missing user to approve into the group', 'VALIDATION_ERROR');
  }

  const group = await GroupRepository.findGroupById(groupId);
  if (!group) throwCustomError(404, 'Group not found', 'GROUP_NOT_FOUND');

  const isAdmin = group.admins.some((id) => id.toString() === adminId.toString());
  if (!isAdmin) {
    throwCustomError(403, 'Only admins can approve members', 'FORBIDDEN');
  }

  const hasRequest = group.pendingRequests.some((id) => id.toString() === targetUserId.toString());
  if (!hasRequest) {
    throwCustomError(400, 'This user is not in the join request list', 'REQUEST_NOT_FOUND');
  }

  const result = await GroupRepository.removeRequestAndAddMember(groupId, targetUserId);
  if (!result.modifiedCount) {
    throwCustomError(409, 'Unable to update pending request. Please reload the group and try again', 'REQUEST_UPDATE_FAILED');
  }

  return result;
}

async function assignAdmin(adminId, groupId, targetUserId) {
  const group = await GroupRepository.findGroupById(groupId);
  if (!group) throwCustomError(404, 'Group not found', 'GROUP_NOT_FOUND');

  const isAdmin = group.admins.some((id) => id.toString() === adminId.toString());
  if (!isAdmin) {
    throwCustomError(403, 'Only admins can assign new admins', 'FORBIDDEN');
  }

  const isMember = group.members.some((id) => id.toString() === targetUserId.toString());
  if (!isMember) {
    throwCustomError(400, 'This user must be a group member before becoming an admin', 'VALIDATION_ERROR');
  }

  const isAlreadyAdmin = group.admins.some((id) => id.toString() === targetUserId.toString());
  if (isAlreadyAdmin) {
    throwCustomError(400, 'This user is already an admin', 'VALIDATION_ERROR');
  }

  return await GroupRepository.addAdmin(groupId, targetUserId);
}

async function removeMember(adminId, groupId, targetUserId) {
  if (!targetUserId) {
    throwCustomError(400, 'Missing member to remove from group', 'VALIDATION_ERROR');
  }

  const group = await getAdminGroup(adminId, groupId);
  if (!includesUserId(group.members, targetUserId)) {
    throwCustomError(400, 'This user is not a group member', 'MEMBER_NOT_FOUND');
  }

  if (targetUserId.toString() === adminId.toString()) {
    throwCustomError(400, 'Admins cannot remove themselves from the group', 'CANNOT_REMOVE_SELF');
  }

  if (getDocumentId(group.creator)?.toString() === targetUserId.toString()) {
    throwCustomError(400, 'Cannot remove the group creator', 'CANNOT_REMOVE_CREATOR');
  }

  const result = await GroupRepository.removeMember(groupId, targetUserId);
  if (!result.modifiedCount) {
    throwCustomError(409, 'Unable to remove member. Please reload the group and try again', 'MEMBER_REMOVE_FAILED');
  }

  return result;
}

module.exports = {
  createNewGroup,
  getGroups,
  getGroupInvitations,
  getGroupDetail,
  updateGroupInfo,
  deleteGroup,
  inviteToGroup,
  acceptGroupInvitation,
  rejectGroupInvitation,
  requestJoinGroup,
  cancelGroupInvitation,
  approveJoinRequest,
  assignAdmin,
  removeMember,
};


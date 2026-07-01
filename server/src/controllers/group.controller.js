const GroupService = require('../services/group.service');

function getAuthUserId(req) {
  return req.user.userId || req.user.id;
}

function sendError(res, error, fallbackCode, fallbackMessage) {
  return res.status(error.statusCode || error.status || 500).json({
    success: false,
    code: error.code || fallbackCode,
    message: error.message || fallbackMessage,
  });
}

function parseJsonField(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  if (Array.isArray(value)) return value;

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function parseBooleanField(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value === 'true';
  return !!value;
}

function getUploadedAvatar(req) {
  return req.file ? `/uploads/${req.file.filename}` : undefined;
}

async function createGroup(req, res) {
  try {
    const creatorId = getAuthUserId(req);
    const { name, description, avatar, isPrivate, invitedUserIds } = req.body;

    const newGroup = await GroupService.createNewGroup(creatorId, {
      name,
      description,
      avatar: getUploadedAvatar(req) || avatar,
      isPrivate: parseBooleanField(isPrivate),
      invitedUserIds: parseJsonField(invitedUserIds, invitedUserIds),
    });

    return res.status(201).json({
      success: true,
      message: 'Group created successfully',
      code: 'CREATE_GROUP_SUCCESS',
      data: newGroup,
    });
  } catch (error) {
    console.error('Error creating group:', error);
    return sendError(res, error, 'CREATE_GROUP_ERROR', 'An error occurred while creating the group');
  }
}

async function getGroups(req, res) {
  try {
    const userId = getAuthUserId(req);
    const result = await GroupService.getGroups(userId);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error loading groups:', error);
    return sendError(res, error, 'GET_GROUP_ERROR', 'An error occurred while loading groups');
  }
}

async function getGroupInvitations(req, res) {
  try {
    const userId = getAuthUserId(req);
    const result = await GroupService.getGroupInvitations(userId);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error loading group invitations:', error);
    return sendError(res, error, 'GET_GROUP_INVITATIONS_ERROR', 'An error occurred while loading group invitations');
  }
}

async function getGroupDetail(req, res) {
  try {
    const userId = getAuthUserId(req);
    const { groupId } = req.params;
    const result = await GroupService.getGroupDetail(userId, groupId);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error loading group details:', error);
    return sendError(res, error, 'GET_GROUP_DETAIL_ERROR', 'An error occurred while loading group details');
  }
}

async function handleUpdateGroupInfo(req, res) {
  try {
    const userId = getAuthUserId(req);
    const { groupId } = req.params;
    const updateData = {
      ...req.body,
    };

    if (req.body.isPrivate !== undefined) {
      updateData.isPrivate = parseBooleanField(req.body.isPrivate);
    }

    const uploadedAvatar = getUploadedAvatar(req);
    if (uploadedAvatar) {
      updateData.avatar = uploadedAvatar;
    }

    const updatedGroup = await GroupService.updateGroupInfo(userId, groupId, updateData);

    return res.status(200).json({
      success: true,
      code: 'UPDATE_GROUP_SUCCESS',
      message: 'Group information updated successfully',
      data: updatedGroup,
    });
  } catch (error) {
    console.error('Error updating group information:', error);
    return sendError(res, error, 'UPDATE_GROUP_ERROR', 'An error occurred while updating the group');
  }
}

async function handleDeleteGroup(req, res) {
  try {
    const adminId = getAuthUserId(req);
    const { groupId } = req.params;

    await GroupService.deleteGroup(adminId, groupId);

    return res.status(200).json({
      success: true,
      code: 'DELETE_GROUP_SUCCESS',
      message: 'Group deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting group:', error);
    return sendError(res, error, 'DELETE_GROUP_ERROR', 'An error occurred while deleting the group');
  }
}

async function handleInviteToGroup(req, res) {
  try {
    const userId = getAuthUserId(req);
    const { groupId } = req.params;
    const { targetUserIds, invitedUserIds } = req.body;

    await GroupService.inviteToGroup(userId, groupId, targetUserIds || invitedUserIds);

    return res.status(200).json({
      success: true,
      code: 'INVITE_USERS_SUCCESS',
      message: 'Group invitation sent successfully',
    });
  } catch (error) {
    console.error('Error inviting users to group:', error);
    return sendError(res, error, 'INVITE_USERS_ERROR', 'An error occurred while inviting users to the group');
  }
}

async function handleAcceptGroupInvitation(req, res) {
  try {
    const userId = getAuthUserId(req);
    const { groupId } = req.params;

    await GroupService.acceptGroupInvitation(userId, groupId);

    return res.status(200).json({
      success: true,
      code: 'ACCEPT_INVITATION_SUCCESS',
      message: 'Group invitation accepted successfully',
    });
  } catch (error) {
    console.error('Error accepting group invitation:', error);
    return sendError(res, error, 'ACCEPT_INVITATION_ERROR', 'An error occurred while accepting the invitation');
  }
}

async function handleRejectGroupInvitation(req, res) {
  try {
    const userId = getAuthUserId(req);
    const { groupId } = req.params;

    await GroupService.rejectGroupInvitation(userId, groupId);

    return res.status(200).json({
      success: true,
      code: 'REJECT_INVITATION_SUCCESS',
      message: 'Group invitation rejected',
    });
  } catch (error) {
    console.error('Error rejecting group invitation:', error);
    return sendError(res, error, 'REJECT_INVITATION_ERROR', 'An error occurred while rejecting the invitation');
  }
}

async function handleRequestJoinGroup(req, res) {
  try {
    const userId = getAuthUserId(req);
    const { groupId } = req.params;

    await GroupService.requestJoinGroup(userId, groupId);

    return res.status(200).json({
      success: true,
      code: 'REQUEST_JOIN_GROUP_SUCCESS',
      message: 'Join request sent. Please wait for admin approval',
    });
  } catch (error) {
    console.error('Error sending join request:', error);
    return sendError(res, error, 'REQUEST_JOIN_GROUP_ERROR', 'An error occurred while sending the join request');
  }
}

async function handleCancelGroupInvitation(req, res) {
  try {
    const adminId = getAuthUserId(req);
    const { groupId } = req.params;
    const { targetUserId, userId, memberId, inviteUserId } = req.body;

    await GroupService.cancelGroupInvitation(
      adminId,
      groupId,
      targetUserId || userId || memberId || inviteUserId,
    );

    return res.status(200).json({
      success: true,
      code: 'CANCEL_INVITATION_SUCCESS',
      message: 'Group invitation cancelled',
    });
  } catch (error) {
    console.error('Error cancelling group invitation:', error);
    return sendError(res, error, 'CANCEL_INVITATION_ERROR', 'An error occurred while cancelling the invitation');
  }
}

async function handleApproveJoinRequest(req, res) {
  try {
    const adminId = getAuthUserId(req);
    const { groupId } = req.params;
    const { targetUserId, userId, memberId, requestUserId } = req.body;

    await GroupService.approveJoinRequest(
      adminId,
      groupId,
      targetUserId || userId || memberId || requestUserId,
    );

    return res.status(200).json({
      success: true,
      code: 'APPROVE_REQUEST_SUCCESS',
      message: 'Join request approved successfully',
    });
  } catch (error) {
    console.error('Error approving join request:', error);
    return sendError(res, error, 'APPROVE_REQUEST_ERROR', 'An error occurred while approving the member');
  }
}

async function handleAssignAdmin(req, res) {
  try {
    const adminId = getAuthUserId(req);
    const { groupId } = req.params;
    const { targetUserId } = req.body;

    await GroupService.assignAdmin(adminId, groupId, targetUserId);

    return res.status(200).json({
      success: true,
      code: 'ASSIGN_ADMIN_SUCCESS',
      message: 'New admin assigned successfully',
    });
  } catch (error) {
    console.error('Error assigning group admin:', error);
    return sendError(res, error, 'ASSIGN_ADMIN_ERROR', 'An error occurred while assigning admin');
  }
}

async function handleRemoveMember(req, res) {
  try {
    const adminId = getAuthUserId(req);
    const { groupId } = req.params;
    const { targetUserId, userId, memberId } = req.body;

    await GroupService.removeMember(
      adminId,
      groupId,
      targetUserId || userId || memberId,
    );

    return res.status(200).json({
      success: true,
      code: 'REMOVE_MEMBER_SUCCESS',
      message: 'Member removed from group',
    });
  } catch (error) {
    console.error('Error removing member from group:', error);
    return sendError(res, error, 'REMOVE_MEMBER_ERROR', 'An error occurred while removing the member');
  }
}

module.exports = {
  createGroup,
  getGroups,
  getGroupInvitations,
  getGroupDetail,
  handleUpdateGroupInfo,
  handleDeleteGroup,
  handleInviteToGroup,
  handleAcceptGroupInvitation,
  handleRejectGroupInvitation,
  handleRequestJoinGroup,
  handleCancelGroupInvitation,
  handleApproveJoinRequest,
  handleAssignAdmin,
  handleRemoveMember,
};


const GroupService = require('../service/group.service');

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

async function createGroup(req, res) {
  try {
    const creatorId = getAuthUserId(req);
    const { name, description, avatar, isPrivate, invitedUserIds } = req.body;

    const newGroup = await GroupService.createNewGroup(creatorId, {
      name,
      description,
      avatar,
      isPrivate,
      invitedUserIds,
    });

    return res.status(201).json({
      success: true,
      message: 'Tạo nhóm thành công',
      code: 'CREATE_GROUP_SUCCESS',
      data: newGroup,
    });
  } catch (error) {
    console.error('Lỗi khi tạo nhóm:', error);
    return sendError(res, error, 'CREATE_GROUP_ERROR', 'Đã xảy ra lỗi khi tạo nhóm');
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
    console.error('Lỗi khi lấy danh sách nhóm:', error);
    return sendError(res, error, 'GET_GROUP_ERROR', 'Đã xảy ra lỗi khi lấy danh sách nhóm');
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
    console.error('Lỗi khi lấy chi tiết nhóm:', error);
    return sendError(res, error, 'GET_GROUP_DETAIL_ERROR', 'Đã xảy ra lỗi khi lấy chi tiết nhóm');
  }
}

async function handleUpdateGroupInfo(req, res) {
  try {
    const userId = getAuthUserId(req);
    const { groupId } = req.params;

    const updatedGroup = await GroupService.updateGroupInfo(userId, groupId, req.body);

    return res.status(200).json({
      success: true,
      code: 'UPDATE_GROUP_SUCCESS',
      message: 'Cập nhật thông tin nhóm thành công',
      data: updatedGroup,
    });
  } catch (error) {
    console.error('Lỗi khi cập nhật thông tin nhóm:', error);
    return sendError(res, error, 'UPDATE_GROUP_ERROR', 'Đã xảy ra lỗi khi cập nhật nhóm');
  }
}

async function handleInviteToGroup(req, res) {
  try {
    const userId = getAuthUserId(req);
    const { groupId } = req.params;
    const { targetUserIds } = req.body;

    await GroupService.inviteToGroup(userId, groupId, targetUserIds);

    return res.status(200).json({
      success: true,
      code: 'INVITE_USERS_SUCCESS',
      message: 'Đã gửi lời mời tham gia nhóm thành công',
    });
  } catch (error) {
    console.error('Lỗi khi mời người dùng vào nhóm:', error);
    return sendError(res, error, 'INVITE_USERS_ERROR', 'Đã xảy ra lỗi khi mời vào nhóm');
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
      message: 'Chấp nhận lời mời tham gia nhóm thành công',
    });
  } catch (error) {
    console.error('Lỗi khi chấp nhận lời mời tham gia nhóm:', error);
    return sendError(res, error, 'ACCEPT_INVITATION_ERROR', 'Đã xảy ra lỗi khi chấp nhận lời mời');
  }
}

async function handleApproveJoinRequest(req, res) {
  try {
    const adminId = getAuthUserId(req);
    const { groupId } = req.params;
    const { targetUserId } = req.body;

    await GroupService.approveJoinRequest(adminId, groupId, targetUserId);

    return res.status(200).json({
      success: true,
      code: 'APPROVE_REQUEST_SUCCESS',
      message: 'Duyệt thành viên vào nhóm thành công',
    });
  } catch (error) {
    console.error('Lỗi khi duyệt yêu cầu tham gia nhóm:', error);
    return sendError(res, error, 'APPROVE_REQUEST_ERROR', 'Đã xảy ra lỗi khi duyệt thành viên');
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
      message: 'Bổ nhiệm Admin mới thành công',
    });
  } catch (error) {
    console.error('Lỗi khi bổ nhiệm Admin nhóm:', error);
    return sendError(res, error, 'ASSIGN_ADMIN_ERROR', 'Đã xảy ra lỗi khi bổ nhiệm admin');
  }
}

module.exports = {
  createGroup,
  getGroups,
  getGroupDetail,
  handleUpdateGroupInfo,
  handleInviteToGroup,
  handleAcceptGroupInvitation,
  handleApproveJoinRequest,
  handleAssignAdmin,
};

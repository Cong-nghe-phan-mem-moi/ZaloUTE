const Group = require('../models/group.model');

async function isGroupAdmin(req, res, next) {
  try {
    const userId = req.user.userId || req.user.id;
    const groupId = req.params.groupId || req.body.groupId;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        code: 'GROUP_NOT_FOUND',
        message: 'Không tìm thấy nhóm',
      });
    }

    const isAdmin = group.admins.some((id) => id.toString() === userId.toString());
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN',
        message: 'Bạn không có quyền admin trong nhóm này',
      });
    }

    req.group = group;
    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  isGroupAdmin,
};

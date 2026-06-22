const express = require('express');
const router = express.Router();
const GroupController = require('../controllers/group.controller');
const { authMiddleware } = require('../middlewares/authMiddleware');
const { isGroupAdmin } = require('../middlewares/group.middleware');
const upload = require('../middlewares/uploadMiddleware');

router.use(authMiddleware);

router.post(
  '/create',
  upload.imageUpload.single('avatar'),
  upload.handleUploadError,
  GroupController.createGroup,
);
router.get('/my-groups', GroupController.getGroups);
router.get('/invitations', GroupController.getGroupInvitations);
router.get('/:groupId', GroupController.getGroupDetail);
router.put(
  '/:groupId',
  isGroupAdmin,
  upload.imageUpload.single('avatar'),
  upload.handleUploadError,
  GroupController.handleUpdateGroupInfo,
);
router.post('/:groupId/invite', isGroupAdmin, GroupController.handleInviteToGroup);
router.post('/:groupId/cancel-invite', isGroupAdmin, GroupController.handleCancelGroupInvitation);
router.post('/:groupId/accept-invite', GroupController.handleAcceptGroupInvitation);
router.post('/:groupId/reject-invite', GroupController.handleRejectGroupInvitation);
router.post('/:groupId/request', GroupController.handleRequestJoinGroup);
router.post('/:groupId/approve', isGroupAdmin, GroupController.handleApproveJoinRequest);
router.post('/:groupId/assign-admin', isGroupAdmin, GroupController.handleAssignAdmin);
router.post('/:groupId/remove-member', isGroupAdmin, GroupController.handleRemoveMember);

module.exports = router;

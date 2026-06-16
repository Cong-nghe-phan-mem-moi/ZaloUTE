const Group = require('../models/group.model');

async function createGroup(groupData) {
    return await Group.create(groupData);
}

async function findGroupById(groupId) {
    return await Group.findById(groupId);
}

async function findGroupDetailById(groupId) {
    return await Group.findById(groupId)
        .populate('creator', 'fullName avatar isOnline lastActive')
        .populate('admins', 'fullName avatar isOnline lastActive')
        .populate('members', 'fullName avatar isOnline lastActive')
        .populate('pendingInvites', 'fullName avatar')
        .populate('pendingRequests', 'fullName avatar')
        .lean();
}

async function getGroupsByUserId(userId) {
    return await Group.find({ members: userId })
        .select('name avatar description members admins isPrivate creator')
        .lean();
}

async function updateGroupInfo(groupId, updateData) {
    return await Group.findByIdAndUpdate(
        groupId,
        { $set: updateData },
        { new: true, runValidators: true }
    ).lean();
}

async function addPendingInvites(groupId, targetUserIds) {
    return await Group.updateOne(
        { _id: groupId },
        {
            $addToSet: {
                pendingInvites: { $each: targetUserIds }
            }
        }
    );
}

async function removeInviteAndAddMember(groupId, userId) {
    return await Group.updateOne(
        { _id: groupId },
        {
            $pull: { pendingInvites: userId },
            $addToSet: { members: userId }
        }
    );
}

async function removeRequestAndAddMember(groupId, userId) {
    return await Group.updateOne(
        { _id: groupId },
        {
            $pull: { pendingRequests: userId },
            $addToSet: { members: userId }
        }
    );
}

async function addAdmin(groupId, targetUserId) {
    return await Group.updateOne(
        { _id: groupId },
        { $addToSet: { admins: targetUserId } }
    );
}

module.exports = {
    createGroup,
    findGroupById,
    findGroupDetailById,
    getGroupsByUserId,
    updateGroupInfo,
    addPendingInvites,
    removeInviteAndAddMember,
    removeRequestAndAddMember,
    addAdmin
};

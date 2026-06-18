const mongoose = require('mongoose');
const Group = require('../models/group.model');

function toObjectId(id) {
    if (id && mongoose.Types.ObjectId.isValid(id)) {
        return new mongoose.Types.ObjectId(id);
    }

    return id;
}

function getIdVariants(id) {
    const objectId = toObjectId(id);
    return [...new Set([objectId, objectId?.toString?.() || String(id)])];
}

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
        .populate('members', 'fullName avatar isOnline lastActive')
        .populate('admins', 'fullName avatar isOnline lastActive')
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
    const memberId = toObjectId(userId);
    const memberIds = getIdVariants(userId);
    return await Group.collection.updateOne(
        { _id: toObjectId(groupId) },
        {
            $pull: {
                pendingInvites: { $in: memberIds },
                pendingRequests: { $in: memberIds }
            },
            $addToSet: { members: memberId }
        }
    );
} 

async function removeRequestAndAddMember(groupId, userId) {
    const memberId = toObjectId(userId);
    const memberIds = getIdVariants(userId);
    return await Group.collection.updateOne(
        { _id: toObjectId(groupId) },
        {
            $pull: {
                pendingRequests: { $in: memberIds },
                pendingInvites: { $in: memberIds }
            },
            $addToSet: { members: memberId }
        }
    );
}

async function addAdmin(groupId, targetUserId) {
    return await Group.updateOne(
        { _id: groupId },
        { $addToSet: { admins: targetUserId } }
    );
}

async function searchGroups({ keyword, limit = 10 }) {
    return await Group.find({
        searchName: { $regex: keyword, $options: 'i' }
    })
    .select('name avatar')
    .limit(limit)
    .lean();
}

async function countSearchGroups({ keyword }) {
    return await Group.countDocuments({
        searchName: { $regex: keyword, $options: 'i' }
    });
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
    addAdmin,
    searchGroups,
    countSearchGroups
};

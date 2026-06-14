const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    type: {
        type: String,
        enum: [
            'friend_request',
            'friend_accept',
            'post_like',
            'post_comment',
            'post_share',
            'comment_reply',
            'comment_like',
            'new_message',
            'group_invite',
            'mention',
            'system'
        ],
        required: true
    },
    content: {
        type: String
    },
    preview: {
        type: String,
        maxlength: 180,
        default: null
    },
    relatedId: {
        type: mongoose.Schema.Types.ObjectId
    },
    relatedType: {
        type: String,
        enum: ['Post', 'Comment', 'FriendRequest', 'User', null],
        default: null
    },
    data: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    isRead: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);

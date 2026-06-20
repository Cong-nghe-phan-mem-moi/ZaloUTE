const mongoose = require('mongoose');

const stickerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    packName: {
        type: String,
        default: ''
    },
    category: {
        type: String
    },
    imageUrl: {
        type: String,
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Sticker', stickerSchema);

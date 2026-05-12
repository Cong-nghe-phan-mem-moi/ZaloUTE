const mongoose = require('mongoose');

const stickerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    category: {
        type: String
    },
    imageUrl: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('Sticker', stickerSchema);
const express = require('express');
const router = express.Router();

const userController = require("../controllers/user.controller");
const authMiddleware = require("../middleware/authMiddleware");
const friendRequestController = require('../controllers/friendRequest.controller');

router.get("/search", authMiddleware.authMiddleware, userController.searchUsers);

router.get("/profile/:id",authMiddleware.authMiddleware, userController.getOtherUserProfile);

router.post('/friend-request', authMiddleware.authMiddleware, friendRequestController.handleSendFriendRequest);

router.put("/friend-request/accept", authMiddleware.authMiddleware, friendRequestController.handleAcceptFriendRequest);

router.post("/logout", authMiddleware.authMiddleware, userController.logout);

module.exports = router;
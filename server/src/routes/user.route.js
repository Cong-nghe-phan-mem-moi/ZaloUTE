const express = require('express');
const router = express.Router();

const userController = require("../controllers/user.controller");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/search", authMiddleware.authMiddleware, userController.searchUsers);

module.exports = router;
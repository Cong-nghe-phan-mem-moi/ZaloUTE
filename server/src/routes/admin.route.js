const express = require("express");
const router = express.Router();
const AdminController = require("../controllers/admin.controller");
const { authMiddleware, authorize } = require("../middleware/authMiddleware");

router.use(authMiddleware, authorize("admin"));

router.get("/stats", AdminController.getStats);

router.get("/users", AdminController.getUsers);
router.put("/users/:userId/status", AdminController.updateUserStatus);
router.delete("/users/:userId", AdminController.deleteUser);

router.get("/posts", AdminController.getPosts);
router.delete("/posts/:postId", AdminController.deletePost);

router.get("/stickers", AdminController.getStickers);
router.post("/stickers", AdminController.createSticker);
router.put("/stickers/:stickerId", AdminController.updateSticker);
router.delete("/stickers/:stickerId", AdminController.deleteSticker);

module.exports = router;

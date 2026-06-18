const express = require("express");
const router = express.Router();
const AdminController = require("../controllers/admin.controller");
const { authMiddleware, authorize } = require("../middlewares/authMiddleware");

router.use(authMiddleware, authorize("admin"));

router.get("/stats", AdminController.getStats);

router.get("/users", AdminController.getUsers);
router.get("/users/:userId/detail", AdminController.getUserDetail);
router.put("/users/:userId/status", AdminController.updateUserStatus);
router.delete("/users/:userId", AdminController.deleteUser);

router.get("/posts", AdminController.getPosts);
router.put("/posts/:postId/hide", AdminController.hidePost);
router.delete("/posts/:postId", AdminController.deletePost);

router.get("/comments", AdminController.getComments);
router.delete("/comments/:commentId", AdminController.deleteComment);

router.get("/reports", AdminController.getReports);
router.put("/reports/:reportId/resolve", AdminController.resolveReport);

router.get("/logs", AdminController.getActionLogs);

router.get("/stickers", AdminController.getStickers);
router.post("/stickers", AdminController.createSticker);
router.put("/stickers/:stickerId", AdminController.updateSticker);
router.delete("/stickers/:stickerId", AdminController.deleteSticker);

module.exports = router;

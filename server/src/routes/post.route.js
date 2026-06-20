const express = require('express');
const router = express.Router();
const PostController = require('../controllers/post.controller');
const { authMiddleware } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

// All post routes require authentication
router.use(authMiddleware);

// 4.1 Tạo bài viết (with file upload)
router.post(
  '/',
  upload.postMedia,
  upload.handleUploadError,
  PostController.createPost,
);

// 4.4 Xem news feed
router.get('/feed', PostController.getNewsFeed);

// Search posts
router.get('/search', PostController.searchPosts);

// Get posts by author
router.get('/author/:authorId', PostController.getPostsByAuthor);

// Group posts
router.get('/group/:groupId', PostController.getGroupPosts);
router.get('/group/:groupId/pending', PostController.getPendingGroupPosts);

// Share post to timeline or message
router.post('/:postId/share', PostController.sharePost);

// Group post moderation
router.post('/:postId/approve', PostController.approveGroupPost);
router.post('/:postId/reject', PostController.rejectGroupPost);

// Get single post (must be after /feed, /search, /author)
router.get('/:postId', PostController.getPost);

// 4.2 Chỉnh sửa bài viết (with file upload)
router.put(
  '/:postId',
  upload.postMedia,
  upload.handleUploadError,
  PostController.updatePost,
);

// 4.3 Xóa bài viết
router.delete('/:postId', PostController.deletePost);

// Like/Unlike post
router.post('/:postId/like', PostController.toggleLike);

// 4.5 Xem danh sách like
router.get('/:postId/likes', PostController.getPostLikes);

// 4.6 Xem danh sách bình luận
router.get('/:postId/comments', PostController.getPostComments);

module.exports = router;

const express = require('express');
const router = express.Router();
const PostController = require('../controllers/post.controller');
const { authMiddleware } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

// All post routes require authentication
router.use(authMiddleware);
router.post(
  '/',
  upload.postMedia,
  upload.handleUploadError,
  PostController.createPost,
);

// 4.4 Xem news feed
router.get('/feed', PostController.getNewsFeed);

// Suggested highlighted posts
router.get('/suggested', PostController.getSuggestedPosts);

// Search posts
router.get('/search', PostController.searchPosts);

// Get posts by author
router.get('/author/:authorId', PostController.getPostsByAuthor);
router.get('/author/:authorId/media', PostController.getUserMedia);
router.get('/author/:authorId/albums', PostController.getUserAlbums);

// Albums
router.post('/albums', PostController.createAlbum);
router.put('/albums/:albumId', PostController.updateAlbum);
router.delete('/albums/:albumId', PostController.deleteAlbum);
router.get('/media/:mediaId/download', PostController.downloadMedia);

// Group posts
router.get('/group/:groupId', PostController.getGroupPosts);
router.get('/group/:groupId/pending', PostController.getPendingGroupPosts);

// Share post to timeline or message
router.post('/:postId/share', PostController.sharePost);

// Group post moderation
router.post('/:postId/approve', PostController.approveGroupPost);
router.post('/:postId/reject', PostController.rejectGroupPost);
// Hide or save a post for current user
router.post('/:postId/hide', PostController.hidePost);
router.post('/:postId/save', PostController.toggleSavePost);

// Get single post (must be after /feed, /search, /author)
router.get('/:postId', PostController.getPost);
router.put(
  '/:postId',
  upload.postMedia,
  upload.handleUploadError,
  PostController.updatePost,
);
router.delete('/:postId', PostController.deletePost);

// Like/Unlike post
router.post('/:postId/like', PostController.toggleLike);
router.get('/:postId/likes', PostController.getPostLikes);
router.get('/:postId/comments', PostController.getPostComments);

module.exports = router;

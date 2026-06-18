const express = require('express');
const StoryController = require('../controllers/story.controller');
const { authMiddleware } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/', StoryController.getStories);
router.post(
  '/',
  upload.storyMedia,
  upload.handleUploadError,
  StoryController.createStory,
);
router.get('/:storyId', StoryController.getStory);
router.post('/:storyId/view', StoryController.markViewed);
router.post('/:storyId/react', StoryController.reactToStory);
router.post('/:storyId/reply', StoryController.replyToStory);
router.get('/:storyId/viewers', StoryController.getViewers);

module.exports = router;

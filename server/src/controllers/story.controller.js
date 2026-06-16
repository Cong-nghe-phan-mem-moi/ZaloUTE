const StoryService = require('../service/story.service');

const fileToMedia = (file) => {
  if (!file) return null;

  return {
    type: file.mimetype.startsWith('image/') ? 'image' : 'video',
    url: `/uploads/${file.filename}`,
    filename: file.filename,
    mimetype: file.mimetype,
  };
};

class StoryController {
  static async createStory(req, res) {
    try {
      const media = fileToMedia(req.files?.[0]);
      const story = await StoryService.createStory(req.user.userId, req.body, media);

      return res.status(201).json({
        success: true,
        message: 'Story created',
        data: story,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message || 'Unable to create story',
      });
    }
  }

  static async getStories(req, res) {
    try {
      const stories = await StoryService.getActiveStories(req.user.userId);

      return res.status(200).json({
        success: true,
        data: stories,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Unable to load stories',
      });
    }
  }

  static async getStory(req, res) {
    try {
      const story = await StoryService.getStory(req.params.storyId, req.user.userId);

      return res.status(200).json({
        success: true,
        data: story,
      });
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: error.message || 'Story not found',
      });
    }
  }

  static async markViewed(req, res) {
    try {
      const story = await StoryService.markViewed(req.params.storyId, req.user.userId);

      return res.status(200).json({
        success: true,
        data: story,
      });
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: error.message || 'Story not found',
      });
    }
  }

  static async reactToStory(req, res) {
    try {
      const story = await StoryService.reactToStory(
        req.params.storyId,
        req.user.userId,
        req.body.reactionType,
      );

      return res.status(200).json({
        success: true,
        data: story,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message || 'Unable to react to story',
      });
    }
  }

  static async replyToStory(req, res) {
    try {
      const story = await StoryService.replyToStory(
        req.params.storyId,
        req.user.userId,
        req.body.content,
      );

      return res.status(201).json({
        success: true,
        data: story,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message || 'Unable to reply to story',
      });
    }
  }

  static async getViewers(req, res) {
    try {
      const viewers = await StoryService.getViewers(req.params.storyId, req.user.userId);

      return res.status(200).json({
        success: true,
        data: viewers,
      });
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: error.message || 'Story not found',
      });
    }
  }
}

module.exports = StoryController;

import getImageUrl from "./imageUrl";

export const STORY_DURATION_MS = 6000;

export const storyReactions = [
  { type: "like", icon: "thumb_up", label: "Like" },
  { type: "love", icon: "favorite", label: "Love" },
  { type: "haha", icon: "sentiment_very_satisfied", label: "Haha" },
  { type: "wow", icon: "mood", label: "Wow" },
  { type: "sad", icon: "sentiment_dissatisfied", label: "Sad" },
  { type: "angry", icon: "sentiment_extremely_dissatisfied", label: "Angry" },
];

export const storyBackgrounds = [
  "#1877f2",
  "#7c3aed",
  "#db2777",
  "#f97316",
  "#059669",
];

export const getReactionInfo = (reactionType) =>
  storyReactions.find((reaction) => reaction.type === reactionType) ||
  storyReactions[0];

export const getProfileId = (profile) =>
  profile?._id || profile?.id || profile?.userId;

export const getStoryAuthorId = (story) =>
  story?.author?._id || story?.author?.id || story?.author;

export const getAuthorName = (story) => story?.author?.fullName || "Story";

export const getAuthorAvatar = (story) =>
  story?.author?.avatar ? getImageUrl(story.author.avatar) : null;

export const getStoryMediaUrl = (story) =>
  story?.media?.url ? getImageUrl(story.media.url) : null;

const getFirstUnviewedStoryIndex = (stories = []) =>
  stories.findIndex((story) => !story.hasViewed);

export const getStoryStartIndex = (stories = []) => {
  const firstUnviewedIndex = getFirstUnviewedStoryIndex(stories);
  return firstUnviewedIndex >= 0 ? firstUnviewedIndex : 0;
};

export const getPreviewStory = (stories = []) =>
  stories[getStoryStartIndex(stories)];

import { useCallback, useEffect, useState } from "react";
import { storyAPI } from "../../services/story.service";
import {
  getAuthorName,
  getStoryMediaUrl,
  STORY_DURATION_MS,
} from "../../utils/storyUtils";

export const useStoryViewer = ({
  groups,
  viewerState,
  currentUserId,
  onChange,
  onDeleted,
  onFinished,
  onStoryUpdated,
}) => {
  const [reply, setReply] = useState("");
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [replyFocused, setReplyFocused] = useState(false);
  const [showInsights, setShowInsights] = useState(false);

  const group = groups[viewerState.groupIndex];
  const story = group?.stories[viewerState.storyIndex];
  const isOwner = String(group?.authorId) === String(currentUserId);
  const mediaUrl = getStoryMediaUrl(story);
  const authorName = getAuthorName(story);
  const isReplying = replyFocused || Boolean(reply.trim());

  const resetTransientState = () => {
    setProgress(0);
    setReply("");
    setError("");
    setShowInsights(false);
  };

  const goNext = useCallback(() => {
    resetTransientState();

    const currentGroup = groups[viewerState.groupIndex];
    if (!currentGroup) {
      onFinished();
      return;
    }

    if (viewerState.storyIndex < currentGroup.stories.length - 1) {
      onChange({ ...viewerState, storyIndex: viewerState.storyIndex + 1 });
      return;
    }

    if (viewerState.groupIndex < groups.length - 1) {
      onChange({ groupIndex: viewerState.groupIndex + 1, storyIndex: 0 });
      return;
    }

    onFinished();
  }, [groups, onChange, onFinished, viewerState]);

  const goPrevious = () => {
    resetTransientState();

    onChange((state) => {
      if (!state) {
        return state;
      }

      if (state.storyIndex > 0) {
        return { ...state, storyIndex: state.storyIndex - 1 };
      }

      if (state.groupIndex > 0) {
        const previousGroup = groups[state.groupIndex - 1];
        return {
          groupIndex: state.groupIndex - 1,
          storyIndex: previousGroup.stories.length - 1,
        };
      }

      return state;
    });
  };

  const storyId = story?._id;

  useEffect(() => {
    if (!storyId) return undefined;

    let isCurrent = true;
    storyAPI
      .markViewed(storyId)
      .then((response) => {
        if (!isCurrent) return;
        const nextStory = response.data?.data;
        if (nextStory) {
          onStoryUpdated(nextStory);
        }
      })
      .catch((err) => {
        if (isCurrent) {
          setError(err.response?.data?.message || "Unable to open story.");
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [storyId, onStoryUpdated]);

  useEffect(() => {
    if (!storyId || paused || showInsights || isReplying) return undefined;

    const interval = window.setInterval(() => {
      setProgress((value) => {
        if (value >= 100) {
          return 100;
        }

        const nextValue = value + 100 / (STORY_DURATION_MS / 100);
        if (nextValue >= 100) {
          window.setTimeout(goNext, 0);
          return 100;
        }

        return nextValue;
      });
    }, 100);

    return () => window.clearInterval(interval);
  }, [storyId, paused, showInsights, isReplying, goNext]);

  const handleReact = async (reactionType) => {
    try {
      const response = await storyAPI.react(story._id, reactionType);
      onStoryUpdated(response.data?.data || story);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to react.");
    }
  };

  const handleReply = async (event) => {
    event.preventDefault();
    if (!reply.trim()) return;

    try {
      const response = await storyAPI.reply(story._id, reply);
      setReply("");
      onStoryUpdated(response.data?.data?.story || story);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to send reply.");
    }
  };

  const handleDelete = async () => {
    if (!story?._id) return;

    try {
      await storyAPI.deleteStory(story._id);
      onDeleted?.(story);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to delete story.");
    }
  };

  return {
    authorName,
    error,
    handleDelete,
    goNext,
    goPrevious,
    group,
    handleReact,
    handleReply,
    isOwner,
    mediaUrl,
    progress,
    reply,
    setPaused,
    setReply,
    setReplyFocused,
    setShowInsights,
    showInsights,
    story,
  };
};

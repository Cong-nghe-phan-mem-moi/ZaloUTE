import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { storyAPI } from "../../services/story.service";
import {
  getProfileId,
  getStoryAuthorId,
  getStoryStartIndex,
} from "../../utils/storyUtils";

export const useStories = ({ profile, initialStoryId, navigate }) => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [viewerState, setViewerState] = useState(null);
  const openedInitialStoryRef = useRef(null);
  const currentUserId = getProfileId(profile);

  const loadStories = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await storyAPI.getStories();
      setStories(response.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load stories.");
      setStories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(loadStories, 0);
    return () => window.clearTimeout(timer);
  }, [loadStories]);

  const groupedStories = useMemo(() => {
    const groups = [];
    const groupByAuthor = new Map();

    stories.forEach((story) => {
      const authorId = String(getStoryAuthorId(story));
      if (!groupByAuthor.has(authorId)) {
        const group = {
          authorId,
          author: story.author,
          stories: [],
        };

        groupByAuthor.set(authorId, group);
        groups.push(group);
      }

      groupByAuthor.get(authorId).stories.push(story);
    });

    return groups
      .map((group) => ({
        ...group,
        stories: [...group.stories].sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
        ),
      }))
      .sort((a, b) => {
        const aOwn = String(a.authorId) === String(currentUserId);
        const bOwn = String(b.authorId) === String(currentUserId);
        if (aOwn !== bOwn) return aOwn ? -1 : 1;

        const aUnread = a.stories.some((story) => !story.hasViewed);
        const bUnread = b.stories.some((story) => !story.hasViewed);
        if (aUnread !== bUnread) return aUnread ? -1 : 1;

        return (
          new Date(b.stories[b.stories.length - 1]?.createdAt || 0) -
          new Date(a.stories[a.stories.length - 1]?.createdAt || 0)
        );
      });
  }, [stories, currentUserId]);

  const ownStories = groupedStories.find(
    (group) => String(group.authorId) === String(currentUserId),
  );

  const openGroup = useCallback(
    (groupIndex) => {
      const group = groupedStories[groupIndex];

      setViewerState({
        groupIndex,
        storyIndex: getStoryStartIndex(group?.stories),
      });
    },
    [groupedStories],
  );

  useEffect(() => {
    if (!initialStoryId || openedInitialStoryRef.current === initialStoryId) {
      return undefined;
    }

    const groupIndex = groupedStories.findIndex((group) =>
      group.stories.some((story) => String(story._id) === String(initialStoryId)),
    );

    if (groupIndex < 0) {
      return undefined;
    }

    const storyIndex = groupedStories[groupIndex].stories.findIndex(
      (story) => String(story._id) === String(initialStoryId),
    );

    const timer = window.setTimeout(() => {
      openedInitialStoryRef.current = initialStoryId;
      setViewerState({ groupIndex, storyIndex });
      navigate("/", { replace: true });
    }, 0);

    return () => window.clearTimeout(timer);
  }, [groupedStories, initialStoryId, navigate]);

  const updateStoryInList = useCallback((nextStory) => {
    setStories((items) =>
      items.map((item) => (item._id === nextStory._id ? nextStory : item)),
    );
  }, []);

  const finishStories = useCallback(() => {
    setViewerState(null);
    window.setTimeout(() => {
      navigate("/", { replace: true });
    }, 0);
  }, [navigate]);

  return {
    currentUserId,
    createOpen,
    error,
    finishStories,
    groupedStories,
    loading,
    loadStories,
    openGroup,
    ownStories,
    setCreateOpen,
    setViewerState,
    updateStoryInList,
    viewerState,
  };
};

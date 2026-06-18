import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { storyAPI } from "../../services/story.service";
import getImageUrl from "../../utils/imageUrl";
import UserAvatar from "../common/UserAvatar";

const STORY_DURATION_MS = 6000;

const reactions = [
  { type: "like", icon: "thumb_up", label: "Like" },
  { type: "love", icon: "favorite", label: "Love" },
  { type: "haha", icon: "sentiment_very_satisfied", label: "Haha" },
  { type: "wow", icon: "mood", label: "Wow" },
  { type: "sad", icon: "sentiment_dissatisfied", label: "Sad" },
  { type: "angry", icon: "sentiment_extremely_dissatisfied", label: "Angry" },
];

const backgrounds = ["#1877f2", "#7c3aed", "#db2777", "#f97316", "#059669"];
const getReactionInfo = (reactionType) =>
  reactions.find((reaction) => reaction.type === reactionType) || reactions[0];

const getProfileId = (profile) => profile?._id || profile?.id || profile?.userId;
const getStoryAuthorId = (story) => story?.author?._id || story?.author?.id || story?.author;
const getAuthorName = (story) => story?.author?.fullName || "Story";
const getAuthorAvatar = (story) =>
  story?.author?.avatar ? getImageUrl(story.author.avatar) : null;
const getStoryMediaUrl = (story) =>
  story?.media?.url ? getImageUrl(story.media.url) : null;
const getFirstUnviewedStoryIndex = (stories = []) =>
  stories.findIndex((story) => !story.hasViewed);
const getStoryStartIndex = (stories = []) => {
  const firstUnviewedIndex = getFirstUnviewedStoryIndex(stories);
  return firstUnviewedIndex >= 0 ? firstUnviewedIndex : 0;
};
const getPreviewStory = (stories = []) => stories[getStoryStartIndex(stories)];

const Stories = ({ profile, initialStoryId = null }) => {
  const navigate = useNavigate();
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

  const openGroup = (groupIndex) => {
    const group = groupedStories[groupIndex];

    setViewerState({
      groupIndex,
      storyIndex: getStoryStartIndex(group?.stories),
    });
  };

  useEffect(() => {
    if (!initialStoryId || openedInitialStoryRef.current === initialStoryId) {
      return;
    }

    const groupIndex = groupedStories.findIndex((group) =>
      group.stories.some((story) => String(story._id) === String(initialStoryId)),
    );

    if (groupIndex < 0) {
      return;
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

  return (
    <section className="rounded bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-[#111827]">Stories</h2>
          <p className="text-xs text-[#6b7280]">Share moments that disappear after 24 hours.</p>
        </div>
        {loading ? (
          <span className="text-xs font-medium text-[#6b7280]">Loading...</span>
        ) : null}
      </div>

      {error ? (
        <div className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </div>
      ) : null}

      <div className="flex gap-3 overflow-x-auto pb-1">
        <AddStoryCard
          profile={profile}
          onCreate={() => setCreateOpen(true)}
        />

        {ownStories ? (
          <OwnStoryCard
            profile={profile}
            group={ownStories}
            onOpen={() => {
              const ownIndex = groupedStories.findIndex(
                (group) => String(group.authorId) === String(currentUserId),
              );
              if (ownIndex >= 0) openGroup(ownIndex);
            }}
          />
        ) : null}

        {groupedStories
          .filter((group) => String(group.authorId) !== String(currentUserId))
          .map((group) => (
            <StoryGroupCard
              key={group.authorId}
              group={group}
              onOpen={() => openGroup(groupedStories.indexOf(group))}
            />
          ))}
      </div>

      {!loading && groupedStories.length === 0 ? (
        <p className="mt-3 text-sm text-[#6b7280]">
          No active stories from you or your friends yet.
        </p>
      ) : null}

      {createOpen ? (
        <CreateStoryModal
          onClose={() => setCreateOpen(false)}
          onCreated={() => {
            setCreateOpen(false);
            loadStories();
          }}
        />
      ) : null}

      {viewerState ? (
        <StoryViewer
          groups={groupedStories}
          viewerState={viewerState}
          currentUserId={currentUserId}
          onChange={setViewerState}
          onClose={() => setViewerState(null)}
          onFinished={finishStories}
          onStoryUpdated={updateStoryInList}
        />
      ) : null}
    </section>
  );
};

const AddStoryCard = ({ profile, onCreate }) => (
  <div className="w-28 shrink-0 overflow-hidden rounded-lg bg-white text-left shadow-sm ring-1 ring-[#eef0f2]">
    <button
      type="button"
      onClick={onCreate}
      className="relative block h-36 w-full bg-[#f0f2f5]"
    >
      {profile?.avatar ? (
        <img
          className="h-full w-full object-cover"
          src={getImageUrl(profile.avatar)}
          alt={profile?.fullName || "Your story"}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-[#e7f3ff]">
          <UserAvatar name={profile?.fullName || "You"} size="md" />
        </div>
      )}
      <span className="absolute bottom-8 left-1/2 flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full border-4 border-white bg-[#1877f2] text-white">
        <span className="material-symbols-outlined text-[20px]">add</span>
      </span>
    </button>
    <button
      type="button"
      onClick={onCreate}
      className="block min-h-12 w-full px-2 py-2 text-center text-xs font-bold text-[#111827] hover:bg-[#f8fafc]"
    >
      Create story
    </button>
  </div>
);

const OwnStoryCard = ({ profile, group, onOpen }) => {
  const previewStory = getPreviewStory(group?.stories);
  const mediaUrl = getStoryMediaUrl(previewStory);
  const hasUnread = group?.stories?.some((story) => !story.hasViewed);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="relative h-48 w-28 shrink-0 overflow-hidden rounded-lg bg-[#111827] text-left shadow-sm ring-1 ring-[#eef0f2]"
    >
      {mediaUrl ? (
        previewStory.type === "video" ? (
          <video className="h-full w-full object-cover" src={mediaUrl} muted />
        ) : (
          <img
            className="h-full w-full object-cover"
            src={mediaUrl}
            alt="Your story"
          />
        )
      ) : (
        <div
          className="flex h-full w-full items-center justify-center px-3 text-center text-sm font-bold text-white"
          style={{ background: previewStory.background || "#1877f2" }}
        >
          {previewStory.text || "Your story"}
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/70" />
      <div
        className={`absolute left-2 top-2 rounded-full p-0.5 ${
          hasUnread ? "bg-[#1877f2]" : "bg-white/70"
        }`}
      >
        <UserAvatar
          image={profile?.avatar ? getImageUrl(profile.avatar) : null}
          name={profile?.fullName || "You"}
          size="xs"
        />
      </div>
      <p className="absolute bottom-2 left-2 right-2 line-clamp-2 text-xs font-bold text-white">
        Your story
      </p>
    </button>
  );
};

const StoryGroupCard = ({ group, onOpen }) => {
  const previewStory = getPreviewStory(group.stories);
  const mediaUrl = getStoryMediaUrl(previewStory);
  const authorName = previewStory?.author?.fullName || "Story";
  const hasUnread = group.stories.some((story) => !story.hasViewed);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="relative h-48 w-28 shrink-0 overflow-hidden rounded-lg bg-[#111827] text-left shadow-sm ring-1 ring-[#eef0f2]"
    >
      {mediaUrl ? (
        previewStory.type === "video" ? (
          <video className="h-full w-full object-cover" src={mediaUrl} muted />
        ) : (
          <img className="h-full w-full object-cover" src={mediaUrl} alt={authorName} />
        )
      ) : (
        <div
          className="flex h-full w-full items-center justify-center px-3 text-center text-sm font-bold text-white"
          style={{ background: previewStory?.background || "#1877f2" }}
        >
          {previewStory?.text || "Story"}
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/70" />
      <div
        className={`absolute left-2 top-2 rounded-full p-0.5 ${
          hasUnread ? "bg-[#1877f2]" : "bg-white/70"
        }`}
      >
        <UserAvatar image={getAuthorAvatar(previewStory)} name={authorName} size="xs" />
      </div>
      <p className="absolute bottom-2 left-2 right-2 line-clamp-2 text-xs font-bold text-white">
        {authorName}
      </p>
    </button>
  );
};

const CreateStoryModal = ({ onClose, onCreated }) => {
  const [mode, setMode] = useState("text");
  const [text, setText] = useState("");
  const [background, setBackground] = useState(backgrounds[0]);
  const [media, setMedia] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const mediaPreview = useMemo(
    () => (media ? URL.createObjectURL(media) : null),
    [media],
  );

  useEffect(
    () => () => {
      if (mediaPreview) URL.revokeObjectURL(mediaPreview);
    },
    [mediaPreview],
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError("");

    try {
      await storyAPI.createStory({ text, background, media });
      onCreated();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to create story.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <form
        onSubmit={handleSubmit}
        className="grid w-full max-w-5xl overflow-hidden rounded-lg bg-white shadow-2xl lg:grid-cols-[280px_minmax(0,1fr)]"
      >
        <aside className="border-b border-[#e5e7eb] p-4 lg:border-b-0 lg:border-r">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-lg font-bold">Create Story</h3>
            <button type="button" onClick={onClose} className="text-[#6b7280]">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="space-y-2">
            <StoryModeButton
              icon="text_fields"
              label="Text story"
              active={mode === "text"}
              onClick={() => {
                setMode("text");
                setMedia(null);
              }}
            />
            <StoryModeButton
              icon="perm_media"
              label="Photo or video"
              active={mode === "media"}
              onClick={() => setMode("media")}
            />
          </div>

          {error ? (
            <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          ) : null}
        </aside>

        <div className="p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-sm font-bold text-[#111827]">Preview</p>
            <button
              type="submit"
              disabled={submitting || (!text.trim() && !media)}
              className="rounded-md bg-[#1877f2] px-5 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Sharing..." : "Share to story"}
            </button>
          </div>

          {mode === "text" ? (
            <>
              <textarea
                value={text}
                onChange={(event) => setText(event.target.value)}
                maxLength={1000}
                className="mb-3 h-28 w-full resize-none rounded-md border border-[#dddfe2] px-3 py-2 text-sm outline-none focus:border-[#1877f2]"
                placeholder="Start typing"
              />
              <div className="mb-4 flex items-center gap-2">
                {backgrounds.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setBackground(color)}
                    className={`h-7 w-7 rounded-full border-2 ${
                      background === color ? "border-[#111827]" : "border-transparent"
                    }`}
                    style={{ background: color }}
                    aria-label={`Use ${color} background`}
                  />
                ))}
              </div>
            </>
          ) : (
            <label className="mb-4 flex cursor-pointer items-center justify-center rounded-md border border-dashed border-[#cbd5e1] px-4 py-5 text-sm font-semibold text-[#4b5563] hover:bg-[#f8fafc]">
              <span className="material-symbols-outlined mr-2 text-[20px]">upload</span>
              Choose photo or video
              <input
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={(event) => setMedia(event.target.files?.[0] || null)}
              />
            </label>
          )}

          {mode === "media" && media ? (
            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              maxLength={1000}
              className="mb-4 h-20 w-full resize-none rounded-md border border-[#dddfe2] px-3 py-2 text-sm outline-none focus:border-[#1877f2]"
              placeholder="Add a caption"
            />
          ) : null}

          <div className="flex min-h-[460px] items-center justify-center rounded-lg bg-[#18191a] p-5">
            <div
              className="relative flex aspect-[9/16] max-h-[70vh] w-full max-w-[300px] items-center justify-center overflow-hidden rounded-lg text-white shadow-2xl"
              style={{ background: mediaPreview ? "#111827" : background }}
            >
              {mediaPreview ? (
                media?.type?.startsWith("video/") ? (
                  <video className="h-full w-full object-contain" src={mediaPreview} controls />
                ) : (
                  <img className="h-full w-full object-contain" src={mediaPreview} alt="Story preview" />
                )
              ) : (
                <p className="px-5 text-center text-2xl font-bold">
                  {text || "Your text story"}
                </p>
              )}
              {mediaPreview && text ? (
                <p className="absolute bottom-5 left-4 right-4 rounded-md bg-black/50 px-4 py-3 text-center text-base font-bold">
                  {text}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

const StoryModeButton = ({ icon, label, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-sm font-bold ${
      active ? "bg-[#e7f3ff] text-[#1877f2]" : "bg-[#f2f3f5] text-[#111827]"
    }`}
  >
    <span className="material-symbols-outlined text-[22px]">{icon}</span>
    {label}
  </button>
);

const StoryViewer = ({
  groups,
  viewerState,
  currentUserId,
  onChange,
  onClose,
  onFinished,
  onStoryUpdated,
}) => {
  const [reply, setReply] = useState("");
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [showInsights, setShowInsights] = useState(false);

  const group = groups[viewerState.groupIndex];
  const story = group?.stories[viewerState.storyIndex];
  const isOwner = String(group?.authorId) === String(currentUserId);
  const mediaUrl = getStoryMediaUrl(story);
  const authorName = getAuthorName(story);

  const goNext = useCallback(() => {
    setProgress(0);
    setReply("");
    setError("");
    setShowInsights(false);

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
    setProgress(0);
    setReply("");
    setError("");
    setShowInsights(false);

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
    if (!storyId || paused || showInsights) return undefined;

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
  }, [storyId, paused, showInsights, goNext]);

  if (!story) return null;

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
      onStoryUpdated(response.data?.data || story);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to send reply.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#111827] text-white">
      <button
        type="button"
        onClick={onClose}
        className="absolute right-5 top-5 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 hover:bg-black/60"
      >
        <span className="material-symbols-outlined">close</span>
      </button>

      <div className="mx-auto flex h-full max-w-6xl items-center justify-center gap-5 px-4 py-5">
        <button
          type="button"
          onClick={goPrevious}
          className="hidden h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 md:flex"
          aria-label="Previous story"
        >
          <span className="material-symbols-outlined">chevron_left</span>
        </button>

        <main
          className="relative flex h-full max-h-[820px] w-full max-w-[460px] overflow-hidden rounded-xl bg-black shadow-2xl"
          onMouseDown={() => setPaused(true)}
          onMouseUp={() => setPaused(false)}
          onMouseLeave={() => setPaused(false)}
          onTouchStart={() => setPaused(true)}
          onTouchEnd={() => setPaused(false)}
        >
          <StoryContent story={story} mediaUrl={mediaUrl} authorName={authorName} />

          <div className="absolute left-0 right-0 top-0 z-20 bg-gradient-to-b from-black/70 to-transparent p-4">
            <div className="mb-3 flex gap-1">
              {group.stories.map((item, index) => (
                <div key={item._id} className="h-1 flex-1 overflow-hidden rounded-full bg-white/30">
                  <div
                    className="h-full rounded-full bg-white transition-all"
                    style={{
                      width:
                        index < viewerState.storyIndex
                          ? "100%"
                          : index === viewerState.storyIndex
                            ? `${progress}%`
                            : "0%",
                    }}
                  />
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <UserAvatar image={getAuthorAvatar(story)} name={authorName} size="sm" />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{authorName}</p>
                <p className="text-xs text-white/70">
                  {story.viewerCount || 0} views - {story.reactionCount || 0} reactions
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={goPrevious}
            className="absolute bottom-20 left-0 top-20 z-10 w-1/3"
            aria-label="Previous story"
          />
          <button
            type="button"
            onClick={goNext}
            className="absolute bottom-20 right-0 top-20 z-10 w-1/3"
            aria-label="Next story"
          />

          <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/80 to-transparent p-4">
            {error ? (
              <p className="mb-3 rounded-md bg-red-500/90 px-3 py-2 text-sm">
                {error}
              </p>
            ) : null}

            {isOwner ? (
              <OwnerStorySummary
                story={story}
                onOpen={() => setShowInsights(true)}
              />
            ) : (
              <>
                <div className="mb-3 flex justify-center gap-2">
                  {reactions.map((reaction) => (
                    <button
                      key={reaction.type}
                      type="button"
                      onClick={() => handleReact(reaction.type)}
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        story.currentUserReaction === reaction.type
                          ? "bg-[#1877f2]"
                          : "bg-white/20 hover:bg-white/30"
                      }`}
                      title={reaction.label}
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {reaction.icon}
                      </span>
                    </button>
                  ))}
                </div>

                <form onSubmit={handleReply} className="flex gap-2">
                  <input
                    value={reply}
                    onChange={(event) => setReply(event.target.value)}
                    className="min-w-0 flex-1 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm text-white outline-none placeholder:text-white/70 focus:border-white"
                    placeholder="Reply to story..."
                  />
                  <button
                    type="submit"
                    disabled={!reply.trim()}
                    className="rounded-full bg-[#1877f2] px-4 text-sm font-bold text-white disabled:opacity-50"
                  >
                    Send
                  </button>
                </form>
              </>
            )}
          </div>

          {isOwner && showInsights ? (
            <OwnerStoryInsights
              story={story}
              onClose={() => setShowInsights(false)}
            />
          ) : null}
        </main>

        <button
          type="button"
          onClick={goNext}
          className="hidden h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 md:flex"
          aria-label="Next story"
        >
          <span className="material-symbols-outlined">chevron_right</span>
        </button>
      </div>
    </div>
  );
};

const StoryContent = ({ story, mediaUrl, authorName }) => (
  <div
    className="flex h-full w-full items-center justify-center text-white"
    style={{ background: mediaUrl ? "#111827" : story.background || "#1877f2" }}
  >
    {mediaUrl ? (
      <div className="relative flex h-full w-full items-center justify-center">
        {story.type === "video" ? (
          <video className="h-full w-full object-contain" src={mediaUrl} autoPlay controls />
        ) : (
          <img className="h-full w-full object-contain" src={mediaUrl} alt={authorName} />
        )}
        {story.text ? (
          <p className="absolute bottom-28 left-5 right-5 rounded-md bg-black/50 px-4 py-3 text-center text-lg font-bold">
            {story.text}
          </p>
        ) : null}
      </div>
    ) : (
      <p className="px-8 text-center text-3xl font-bold">{story.text || "Story"}</p>
    )}
  </div>
);

const OwnerStorySummary = ({ story, onOpen }) => (
  <button
    type="button"
    onClick={onOpen}
    className="flex w-fit items-center gap-3 rounded-full bg-black/55 px-4 py-2 text-sm font-bold text-white backdrop-blur hover:bg-black/70"
  >
    <span className="material-symbols-outlined text-[20px]">visibility</span>
    <span>{story.viewers?.length || story.viewerCount || 0}</span>
    <span className="material-symbols-outlined text-[18px]">keyboard_arrow_up</span>
  </button>
);

const OwnerStoryInsights = ({ story, onClose }) => (
  <div className="absolute bottom-4 left-4 right-4 z-30 max-h-[70%] overflow-hidden rounded-xl bg-white text-[#111827] shadow-2xl">
    <div className="flex items-center justify-between border-b border-[#e5e7eb] px-4 py-3">
      <div>
        <p className="text-sm font-bold">Story details</p>
        <p className="text-xs text-[#6b7280]">
          {story.viewers?.length || story.viewerCount || 0} viewers - {story.reactionCount || 0} reactions
        </p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f2f3f5] text-[#111827]"
      >
        <span className="material-symbols-outlined text-[18px]">close</span>
      </button>
    </div>

    <div className="grid max-h-[520px] gap-4 overflow-y-auto p-4 sm:grid-cols-2">
      <div>
        <div className="mb-3 flex items-center gap-2 text-sm font-bold">
        <span className="material-symbols-outlined text-[18px]">visibility</span>
          Viewed by
        </div>
        {(story.viewers || []).map((viewer) => (
          <StoryPerson
            key={viewer.user?._id || viewer.user}
            user={viewer.user}
            meta={new Date(viewer.viewedAt).toLocaleTimeString()}
            dark={false}
          />
        ))}
        {story.viewers?.length ? null : (
          <p className="text-sm text-[#6b7280]">No viewers yet.</p>
        )}
      </div>

      <div>
        <div className="mb-3 flex items-center gap-2 text-sm font-bold">
          <span className="material-symbols-outlined text-[18px]">favorite</span>
          Reactions
        </div>
        {(story.reactions || []).map((reaction) => {
          const reactionInfo = getReactionInfo(reaction.type);

          return (
            <div
              key={reaction._id || `${reaction.user?._id || reaction.user}-${reaction.type}`}
              className="mb-2 flex items-center justify-between rounded-md bg-[#f8fafc] p-2"
            >
              <StoryPerson
                user={reaction.user}
                meta={reactionInfo.label}
                dark={false}
              />
              <span className="material-symbols-outlined text-[20px] text-[#1877f2]">
                {reactionInfo.icon}
              </span>
            </div>
          );
        })}
        {story.reactions?.length ? null : (
          <p className="text-sm text-[#6b7280]">No reactions yet.</p>
        )}

        <div className="mb-3 mt-5 flex items-center gap-2 text-sm font-bold">
          <span className="material-symbols-outlined text-[18px]">reply</span>
          Replies
        </div>
        {(story.replies || []).map((reply) => (
          <div key={reply._id} className="mb-2 rounded-md bg-[#f8fafc] p-2">
            <StoryPerson
              user={reply.user}
              meta={new Date(reply.createdAt).toLocaleTimeString()}
              dark={false}
            />
            <p className="mt-1 text-xs">{reply.content}</p>
          </div>
        ))}
        {story.replies?.length ? null : (
          <p className="text-sm text-[#6b7280]">No replies yet.</p>
        )}
      </div>
    </div>
  </div>
);

const StoryPerson = ({ user, meta, dark = true }) => (
  <div className="mb-2 flex items-center gap-2">
    <UserAvatar
      image={user?.avatar ? getImageUrl(user.avatar) : null}
      name={user?.fullName || "User"}
      size="xs"
    />
    <div className="min-w-0">
      <p className={`truncate text-xs font-bold ${dark ? "text-white" : "text-[#111827]"}`}>
        {user?.fullName || "User"}
      </p>
      <p className={`text-[11px] ${dark ? "text-white/70" : "text-[#6b7280]"}`}>
        {meta}
      </p>
    </div>
  </div>
);

export default Stories;

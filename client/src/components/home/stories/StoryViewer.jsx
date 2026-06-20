import { useStoryViewer } from "../../../hooks";
import getImageUrl from "../../../utils/imageUrl";
import {
  getAuthorAvatar,
  getReactionInfo,
  storyReactions,
} from "../../../utils/storyUtils";
import UserAvatar from "../../common/UserAvatar";

const StoryViewer = ({
  groups,
  viewerState,
  currentUserId,
  onChange,
  onClose,
  onDeleted,
  onFinished,
  onStoryUpdated,
}) => {
  const {
    authorName,
    error,
    goNext,
    goPrevious,
    group,
    handleDelete,
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
  } = useStoryViewer({
    groups,
    viewerState,
    currentUserId,
    onChange,
    onDeleted,
    onFinished,
    onStoryUpdated,
  });

  if (!story) return null;

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
              <div className="flex items-center justify-between gap-3">
                <OwnerStorySummary
                  story={story}
                  onOpen={() => setShowInsights(true)}
                />
                <button
                  type="button"
                  onClick={handleDelete}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur hover:bg-red-600"
                  aria-label="Delete story"
                  title="Delete story"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    delete
                  </span>
                </button>
              </div>
            ) : (
              <>
                <div className="mb-3 flex justify-center gap-2">
                  {storyReactions.map((reaction) => (
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
                    onFocus={() => setReplyFocused(true)}
                    onBlur={() => setReplyFocused(false)}
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

export default StoryViewer;

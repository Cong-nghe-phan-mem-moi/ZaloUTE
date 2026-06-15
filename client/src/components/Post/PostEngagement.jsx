const REACTIONS = [
  { type: "like", label: "Like", icon: "👍", color: "text-blue-600" },
  { type: "love", label: "Love", icon: "❤️", color: "text-red-500" },
  { type: "haha", label: "Haha", icon: "😆", color: "text-yellow-500" },
  { type: "wow", label: "Wow", icon: "😮", color: "text-yellow-500" },
  { type: "sad", label: "Sad", icon: "😢", color: "text-yellow-500" },
  { type: "angry", label: "Angry", icon: "😡", color: "text-orange-600" },
];

const formatCompactCount = (value = 0) => {
  const count = Number(value) || 0;

  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(count >= 10000000 ? 0 : 1).replace(/\.0$/, "")}M`;
  }

  if (count >= 1000) {
    return `${(count / 1000).toFixed(count >= 10000 ? 0 : 1).replace(/\.0$/, "")}K`;
  }

  return String(count);
};

const getTopReactions = (summary = {}) =>
  REACTIONS.filter((reaction) => (summary[reaction.type] || 0) > 0)
    .sort((a, b) => (summary[b.type] || 0) - (summary[a.type] || 0))
    .slice(0, 3);

const pluralize = (count, singular, plural = `${singular}s`) =>
  `${formatCompactCount(count)} ${count === 1 ? singular : plural}`;

const ReactionPicker = ({ onReact }) => (
  <div className="absolute bottom-[calc(100%-4px)] left-1/2 z-20 hidden -translate-x-1/2 rounded-full border border-gray-200 bg-white px-2 py-1.5 shadow-lg group-hover:flex">
    {REACTIONS.map((reaction) => (
      <button
        key={reaction.type}
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onReact(reaction.type);
        }}
        className="flex h-10 w-10 items-center justify-center rounded-full text-2xl transition hover:-translate-y-1 hover:scale-125"
        title={reaction.label}
        aria-label={reaction.label}
      >
        {reaction.icon}
      </button>
    ))}
  </div>
);

const PostEngagement = ({
  post,
  onReact,
  onComment,
  onShare,
  showActions = true,
}) => {
  const reactionCount = post?.reactionCount ?? post?.likes?.length ?? 0;
  const commentCount = post?.commentCount || 0;
  const shareCount = post?.shareCount || 0;
  const topReactions = getTopReactions(post?.reactionSummary);
  const currentReaction = REACTIONS.find(
    (reaction) => reaction.type === post?.currentUserReaction,
  );

  return (
    <>
      <div className="flex items-center justify-between border-y border-gray-100 px-4 py-2 text-sm text-gray-500">
        <button
          type="button"
          onClick={onComment}
          className="flex items-center gap-1.5 hover:text-blue-500"
        >
          <span className="flex -space-x-1">
            {topReactions.length > 0 ? (
              topReactions.map((reaction) => (
                <span
                  key={reaction.type}
                  className="flex h-5 w-5 items-center justify-center rounded-full border border-white bg-white text-[13px] shadow-sm"
                  title={reaction.label}
                >
                  {reaction.icon}
                </span>
              ))
            ) : (
              <span className="material-symbols-outlined text-[18px]">
                thumb_up
              </span>
            )}
          </span>
          <span>{formatCompactCount(reactionCount)}</span>
        </button>

        <div className="flex items-center gap-4">
          <button type="button" onClick={onComment} className="hover:text-blue-500">
            {pluralize(commentCount, "comment")}
          </button>
          <button type="button" onClick={onShare} className="hover:text-blue-500">
            {pluralize(shareCount, "share")}
          </button>
        </div>
      </div>

      {showActions ? (
        <div className="flex gap-1 p-2 text-gray-600">
          <div className="group relative flex-1">
            <ReactionPicker onReact={onReact} />
            <button
              type="button"
              onClick={() => onReact(currentReaction?.type || "like")}
              className={`flex w-full items-center justify-center gap-2 rounded-lg py-2 font-medium transition hover:bg-gray-100 ${
                currentReaction ? currentReaction.color : "text-gray-600"
              }`}
            >
              <span className="text-lg">
                {currentReaction?.icon || (
                  <span className="material-symbols-outlined text-[20px]">
                    thumb_up
                  </span>
                )}
              </span>
              {currentReaction?.label || "Like"}
            </button>
          </div>

          <button
            type="button"
            onClick={onComment}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg py-2 font-medium text-gray-600 transition hover:bg-gray-100"
          >
            <span className="material-symbols-outlined text-[20px]">
              chat_bubble
            </span>
            Comment
          </button>

          <button
            type="button"
            onClick={onShare}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg py-2 font-medium text-gray-600 transition hover:bg-gray-100"
          >
            <span className="material-symbols-outlined text-[22px]">share</span>
            Share
          </button>
        </div>
      ) : null}
    </>
  );
};

export default PostEngagement;

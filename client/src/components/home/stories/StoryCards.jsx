import getImageUrl from "../../../utils/imageUrl";
import {
  getAuthorAvatar,
  getPreviewStory,
  getStoryMediaUrl,
} from "../../../utils/storyUtils";
import UserAvatar from "../../common/UserAvatar";

export const AddStoryCard = ({ profile, onCreate }) => (
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

export const OwnStoryCard = ({ profile, group, onOpen }) => {
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

export const StoryGroupCard = ({ group, onOpen }) => {
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
          <img
            className="h-full w-full object-cover"
            src={mediaUrl}
            alt={authorName}
          />
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

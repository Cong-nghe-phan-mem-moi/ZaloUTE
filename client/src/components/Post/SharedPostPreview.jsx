import { useState } from "react";

const isUsableMedia = (item) => {
  const url = item?.url?.trim?.();

  return (
    url &&
    url !== "/uploads/" &&
    url !== "undefined" &&
    url !== "null" &&
    ["image", "video"].includes(item.type)
  );
};

const SharedPostPreview = ({ post, onOpen }) => {
  if (!post) {
    return null;
  }

  const firstMedia = Array.isArray(post.media)
    ? post.media.find(isUsableMedia)
    : null;

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onOpen?.(post._id);
      }}
      className="mb-3 w-full rounded-lg border border-gray-200 bg-white p-3 text-left transition hover:bg-gray-50"
    >
      <div className="mb-2 flex items-center gap-2">
        <img
          src={post.author?.avatar || "/default-avatar.png"}
          alt={post.author?.fullName || "Post author"}
          className="h-8 w-8 rounded-full object-cover"
        />
        <span className="font-semibold text-gray-900">
          {post.author?.fullName || "Unknown author"}
        </span>
      </div>

      {post.content ? (
        <p className="mb-2 line-clamp-3 text-sm leading-relaxed text-gray-700">
          {post.content}
        </p>
      ) : null}

      <SharedMediaPreview media={firstMedia} />
    </button>
  );
};

const SharedMediaPreview = ({ media }) => {
  const [failed, setFailed] = useState(false);

  if (!media || failed) {
    return null;
  }

  if (media.type === "image") {
    return (
      <div className="overflow-hidden rounded-md bg-gray-100">
        <img
          src={media.url}
          alt=""
          className="max-h-64 w-full object-contain"
          onError={() => setFailed(true)}
        />
      </div>
    );
  }

  if (media.type === "video") {
    return (
      <div className="overflow-hidden rounded-md bg-black">
        <video
          src={media.url}
          controls
          preload="metadata"
          className="max-h-64 w-full object-contain"
          onError={() => setFailed(true)}
          onClick={(event) => event.stopPropagation()}
          onMouseDown={(event) => event.stopPropagation()}
        />
      </div>
    );
  }

  return null;
};

export default SharedPostPreview;

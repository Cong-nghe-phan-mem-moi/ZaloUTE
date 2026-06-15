const SharedPostPreview = ({ post, onOpen }) => {
  if (!post) {
    return null;
  }

  const firstMedia = Array.isArray(post.media) ? post.media[0] : null;

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

      {firstMedia ? (
        <div className="overflow-hidden rounded-md bg-gray-100">
          {firstMedia.type === "image" ? (
            <img
              src={firstMedia.url}
              alt="Shared post media"
              className="max-h-64 w-full object-contain"
            />
          ) : (
            <div className="flex h-32 items-center justify-center bg-black text-white">
              <span className="material-symbols-outlined mr-2">play_circle</span>
              Video
            </div>
          )}
        </div>
      ) : null}
    </button>
  );
};

export default SharedPostPreview;

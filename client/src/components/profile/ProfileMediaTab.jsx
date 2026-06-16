const getMediaType = (item) => (item?.type === "image" ? "image" : "video");

export default function ProfileMediaTab({ posts = [] }) {
  const mediaItems = posts.flatMap((post) =>
    (post.media || []).map((item, index) => ({
      id: `${post._id}-${index}`,
      url: item.url,
      type: getMediaType(item),
    })),
  );

  if (mediaItems.length === 0) {
    return (
      <div className="rounded bg-white p-8 text-center text-sm text-[#6b7280] shadow-sm">
        No photos or videos yet.
      </div>
    );
  }

  return (
    <div className="rounded bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-[#111827]">Photos & Videos</h2>
        <span className="text-sm text-[#6b7280]">
          {mediaItems.length} items
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
        {mediaItems.map((item) => (
          <div
            key={item.id}
            className="group relative aspect-square overflow-hidden rounded-md bg-[#f3f4f6] max-w-[120px]"
          >
            {item.type === "image" ? (
              <img
                src={item.url}
                alt="Profile media"
                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              />
            ) : (
              <video
                src={item.url}
                className="h-full w-full object-cover"
                controls
                preload="metadata"
              />
            )}
            <div className="absolute left-2 top-2 rounded bg-black/55 px-2 py-1 text-xs font-semibold text-white">
              {item.type === "image" ? "Photo" : "Video"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

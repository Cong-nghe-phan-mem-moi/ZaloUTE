import { postAPI } from "../../services/post.service";

const MediaLightbox = ({ items, activeIndex, onClose, onMove }) => {
  const item = items[activeIndex];

  if (!item) return null;

  return (
    <div className="fixed inset-0 z-[80] bg-black/90 text-white">
      <div className="absolute left-4 top-4 z-10 flex items-center gap-2">
        <button
          type="button"
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
          aria-label="Close"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
        <a
          href={postAPI.getMediaDownloadUrl(item.id)}
          className="flex h-10 items-center gap-2 rounded-full bg-white/10 px-4 text-sm font-semibold hover:bg-white/20"
        >
          <span className="material-symbols-outlined text-[20px]">download</span>
          Download
        </a>
      </div>

      <div className="absolute right-4 top-4 z-10 max-w-[min(360px,calc(100vw-120px))] text-right">
        <p className="truncate text-sm font-bold">
          {item.author?.fullName || "ZaloUTE User"}
        </p>
        <p className="text-xs text-white/65">
          {item.createdAt ? new Date(item.createdAt).toLocaleString() : ""}
        </p>
      </div>

      <div className="flex h-full items-center justify-center px-14 py-16">
        {item.type === "video" ? (
          <video
            src={item.url}
            className="max-h-full max-w-full rounded bg-black"
            controls
            autoPlay
          />
        ) : (
          <img
            src={item.url}
            alt={item.postContent || "Gallery media"}
            className="max-h-full max-w-full object-contain"
          />
        )}
      </div>

      {items.length > 1 ? (
        <>
          <button
            type="button"
            onClick={() => onMove(-1)}
            className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
            aria-label="Previous media"
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <button
            type="button"
            onClick={() => onMove(1)}
            className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
            aria-label="Next media"
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </>
      ) : null}
    </div>
  );
};

export default MediaLightbox;

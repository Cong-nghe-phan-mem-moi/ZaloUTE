import { useCallback, useEffect, useMemo, useState } from "react";
import StatusCard from "../common/StatusCard";
import { postAPI } from "../../services/post.service";
import AlbumEditorModal from "./AlbumEditorModal";
import MediaLightbox from "./MediaLightbox";

const filters = [
  { id: "all", label: "All", icon: "perm_media" },
  { id: "image", label: "Photos", icon: "photo_library" },
  { id: "video", label: "Videos", icon: "video_library" },
  { id: "albums", label: "Albums", icon: "collections_bookmark" },
];

const flattenAlbumMedia = (album) =>
  (album.mediaItems || []).map((item) => ({
    ...item,
    albumId: album.id,
    albumTitle: album.title,
  }));

const UserMediaGallery = ({ userId, isOwnProfile = false }) => {
  const [activeFilter, setActiveFilter] = useState("all");
  const [mediaItems, setMediaItems] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingAlbum, setSavingAlbum] = useState(false);
  const [albumModalOpen, setAlbumModalOpen] = useState(false);
  const [lightbox, setLightbox] = useState({ open: false, items: [], index: 0 });
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const loadGallery = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError("");

    try {
      const [mediaResponse, albumsResponse] = await Promise.all([
        postAPI.getUserMedia(userId, { type: "all", limit: 96 }),
        postAPI.getUserAlbums(userId),
      ]);
      setMediaItems(mediaResponse.data?.data?.items || []);
      setAlbums(albumsResponse.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load gallery.");
      setMediaItems([]);
      setAlbums([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    const timer = window.setTimeout(loadGallery, 0);
    return () => window.clearTimeout(timer);
  }, [loadGallery]);

  const visibleMedia = useMemo(() => {
    if (activeFilter === "albums") return [];
    if (activeFilter === "all") return mediaItems;
    return mediaItems.filter((item) => item.type === activeFilter);
  }, [activeFilter, mediaItems]);

  const openMediaLightbox = (items, index) => {
    setLightbox({ open: true, items, index });
  };

  const moveLightbox = (step) => {
    setLightbox((current) => ({
      ...current,
      index:
        (current.index + step + current.items.length) %
        Math.max(current.items.length, 1),
    }));
  };

  const handleCreateAlbum = async (payload) => {
    setSavingAlbum(true);
    setNotice("");
    setError("");

    try {
      const response = await postAPI.createAlbum(payload);
      setAlbums((current) => [response.data?.data, ...current].filter(Boolean));
      setAlbumModalOpen(false);
      setNotice("Album created.");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to create album.");
    } finally {
      setSavingAlbum(false);
    }
  };

  if (!userId) {
    return (
      <StatusCard
        icon="perm_media"
        message="Gallery is unavailable."
        layout="inline"
      />
    );
  }

  return (
    <section className="space-y-4">
      <div className="rounded-lg bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-[#111827]">Photos and videos</h2>
            <p className="mt-1 text-sm text-[#65676b]">
              {mediaItems.length} media items - {albums.length} albums
            </p>
          </div>
          {isOwnProfile ? (
            <button
              type="button"
              onClick={() => setAlbumModalOpen(true)}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[#1877f2] px-4 text-sm font-semibold text-white hover:bg-[#166fe5] sm:w-auto"
            >
              <span className="material-symbols-outlined text-[19px]">add_photo_alternate</span>
              Create album
            </button>
          ) : null}
        </div>

        <div className="mt-5 flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
          {filters.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setActiveFilter(filter.id)}
              className={`flex h-10 shrink-0 items-center gap-2 rounded-md px-4 text-sm font-semibold ${
                activeFilter === filter.id
                  ? "bg-[#e7f3ff] text-[#1877f2]"
                  : "bg-[#f2f3f5] text-[#050505] hover:bg-[#e5e7eb]"
              }`}
            >
              <span className="material-symbols-outlined text-[19px]">{filter.icon}</span>
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {notice ? <StatusCard icon="check_circle" message={notice} layout="inline" /> : null}
      {error ? <StatusCard icon="error" tone="error" message={error} layout="inline" /> : null}

      {loading ? (
        <StatusCard icon="sync" message="Loading media..." loading />
      ) : activeFilter === "albums" ? (
        <AlbumGrid albums={albums} onOpen={openMediaLightbox} />
      ) : (
        <MediaGrid items={visibleMedia} onOpen={openMediaLightbox} />
      )}

      {albumModalOpen ? (
        <AlbumEditorModal
          mediaItems={mediaItems}
          saving={savingAlbum}
          onClose={() => setAlbumModalOpen(false)}
          onSubmit={handleCreateAlbum}
        />
      ) : null}

      {lightbox.open ? (
        <MediaLightbox
          items={lightbox.items}
          activeIndex={lightbox.index}
          onClose={() => setLightbox({ open: false, items: [], index: 0 })}
          onMove={moveLightbox}
        />
      ) : null}
    </section>
  );
};

const MediaGrid = ({ items, onOpen }) => {
  if (items.length === 0) {
    return (
      <div className="rounded-lg bg-white p-8 text-center text-sm font-semibold text-[#65676b] shadow-sm">
        No media to show.
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white p-3 shadow-sm sm:p-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
        {items.map((item, index) => (
          <MediaTile
            key={item.id}
            item={item}
            onClick={() => onOpen(items, index)}
          />
        ))}
      </div>
    </div>
  );
};

const AlbumGrid = ({ albums, onOpen }) => {
  if (albums.length === 0) {
    return (
      <div className="rounded-lg bg-white p-8 text-center text-sm font-semibold text-[#65676b] shadow-sm">
        No albums yet.
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
      {albums.map((album) => {
        const albumItems = flattenAlbumMedia(album);

        return (
          <button
            key={album.id}
            type="button"
            onClick={() => albumItems.length > 0 && onOpen(albumItems, 0)}
            className="overflow-hidden rounded-lg bg-white text-left shadow-sm ring-1 ring-[#eef0f2] hover:shadow-md"
          >
            <div className="relative aspect-[4/3] bg-[#f2f3f5]">
              {album.coverUrl ? (
                <img src={album.coverUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-[#1877f2]">
                  <span className="material-symbols-outlined text-[42px]">
                    collections_bookmark
                  </span>
                </div>
              )}
              <span className="absolute bottom-3 right-3 rounded bg-black/60 px-2 py-1 text-xs font-semibold text-white">
                {album.mediaCount} items
              </span>
            </div>
            <div className="p-4">
              <h3 className="truncate text-sm font-bold">{album.title}</h3>
              <p className="mt-1 line-clamp-2 text-xs text-[#65676b]">
                {album.description || "Album"}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
};

const MediaTile = ({ item, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="group relative aspect-square overflow-hidden rounded-md bg-[#f2f3f5]"
  >
    {item.type === "video" ? (
      <video src={item.url} className="h-full w-full object-cover" preload="metadata" />
    ) : (
      <img
        src={item.url}
        alt={item.postContent || "Gallery media"}
        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
      />
    )}
    <span className="absolute left-2 top-2 rounded bg-black/55 px-2 py-1 text-xs font-semibold text-white">
      {item.type === "video" ? "Video" : "Photo"}
    </span>
  </button>
);

export default UserMediaGallery;

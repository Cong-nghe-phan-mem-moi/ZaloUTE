import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getPost, toggleLike } from "../../store/slices/postSlice";
import { formatDistanceToNow } from "date-fns";
import { enUS } from "date-fns/locale";
import LoadingSpinner from "../common/LoadingSpinner";
import ErrorMessage from "../common/ErrorMessage";
import CommentSection from "./CommentSection";

const PostDetail = ({ postId, isOpen = false, onClose }) => {
  const dispatch = useDispatch();
  const { currentPost, loading, error } = useSelector((state) => state.posts);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);

  useEffect(() => {
    if (isOpen && postId) {
      setSelectedMediaIndex(0);
      dispatch(getPost(postId));
    }
  }, [isOpen, postId, dispatch]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleToggleLike = () => {
    if (currentPost) {
      dispatch(toggleLike(currentPost._id));
    }
  };

  if (!isOpen || !postId) {
    return null;
  }

  const renderBody = () => {
    if (loading && (!currentPost || currentPost._id !== postId)) {
      return (
        <div className="flex min-h-[360px] items-center justify-center">
          <LoadingSpinner />
        </div>
      );
    }

    if (error) {
      return (
        <div className="p-4">
          <ErrorMessage message={error} onClose={() => {}} />
        </div>
      );
    }

    if (!currentPost || currentPost._id !== postId) {
      return (
        <div className="p-8 text-center text-gray-500">Post not found</div>
      );
    }

    return (
      <>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white p-4">
          <div className="flex items-center gap-3">
            <img
              src={currentPost.author?.avatar || "/default-avatar.png"}
              alt={currentPost.author?.fullName}
              className="h-12 w-12 rounded-full object-cover"
            />
            <div>
              <h3 className="font-semibold text-gray-900">
                {currentPost.author?.fullName}
              </h3>
              <p className="text-sm text-gray-500">
                {formatDistanceToNow(new Date(currentPost.createdAt), {
                  addSuffix: true,
                  locale: enUS,
                })}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close post detail"
            className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        <div className="p-4">
          {currentPost.content ? (
            <p className="mb-4 text-base leading-relaxed text-gray-800">
              {currentPost.content}
            </p>
          ) : null}

          <PostMediaViewer
            media={currentPost.media}
            selectedIndex={selectedMediaIndex}
            onSelect={setSelectedMediaIndex}
          />
        </div>

        <div className="flex justify-between border-y px-4 py-3 text-sm text-gray-600">
          <div>{currentPost.likes?.length || 0} likes</div>
          <div>{currentPost.commentCount || 0} comments</div>
        </div>

        <div className="flex gap-2 border-b p-3 text-gray-600">
          <button
            type="button"
            onClick={handleToggleLike}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 transition ${
              currentPost.isLiked
                ? "bg-blue-100 font-semibold text-blue-600"
                : "hover:bg-gray-100"
            }`}
          >
            {currentPost.isLiked ? "Unlike" : "Like"}
          </button>
          <button
            type="button"
            className="flex flex-1 items-center justify-center gap-2 rounded-lg py-2 transition hover:bg-gray-100"
          >
            Comment
          </button>
          <button
            type="button"
            className="flex flex-1 items-center justify-center gap-2 rounded-lg py-2 transition hover:bg-gray-100"
          >
            Share
          </button>
        </div>

        <CommentSection
          postId={postId}
          onCommentAdded={() => {
            dispatch(getPost(postId));
          }}
        />
      </>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-3 py-4"
      onMouseDown={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        {renderBody()}
      </div>
    </div>
  );
};

const PostMediaViewer = ({ media, selectedIndex, onSelect }) => {
  if (!Array.isArray(media) || media.length === 0) {
    return null;
  }

  const activeIndex = Math.min(selectedIndex, media.length - 1);
  const activeMedia = media[activeIndex];
  const hasMultipleMedia = media.length > 1;

  const handlePrevious = () => {
    onSelect((activeIndex - 1 + media.length) % media.length);
  };

  const handleNext = () => {
    onSelect((activeIndex + 1) % media.length);
  };

  return (
    <div className="mb-4">
      <div className="relative overflow-hidden rounded-lg bg-black">
        {activeMedia.type === "image" ? (
          <img
            src={activeMedia.url}
            alt={`Post media ${activeIndex + 1}`}
            className="max-h-[70vh] w-full object-contain"
            onError={(event) => {
              event.target.style.display = "none";
            }}
          />
        ) : (
          <video
            src={activeMedia.url}
            controls
            preload="metadata"
            className="max-h-[70vh] w-full bg-black object-contain"
            onError={(event) => {
              event.target.style.display = "none";
            }}
          />
        )}

        {hasMultipleMedia ? (
          <>
            <button
              type="button"
              onClick={handlePrevious}
              className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white hover:bg-black/75"
              aria-label="Previous media"
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white hover:bg-black/75"
              aria-label="Next media"
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
            <div className="absolute bottom-3 right-3 rounded-full bg-black/65 px-3 py-1 text-xs font-semibold text-white">
              {activeIndex + 1}/{media.length}
            </div>
          </>
        ) : null}
      </div>

      {hasMultipleMedia ? (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {media.map((item, index) => (
            <button
              key={`${item.url || "media"}-${index}`}
              type="button"
              onClick={() => onSelect(index)}
              className={`h-16 w-20 shrink-0 overflow-hidden rounded-md border-2 bg-gray-200 ${
                index === activeIndex ? "border-blue-500" : "border-transparent"
              }`}
              aria-label={`View media ${index + 1}`}
            >
              {item.type === "image" ? (
                <img
                  src={item.url}
                  alt={`Post media thumbnail ${index + 1}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="relative h-full w-full bg-black">
                  <video
                    src={item.url}
                    preload="metadata"
                    className="h-full w-full object-cover opacity-80"
                  />
                  <span className="material-symbols-outlined absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white">
                    play_circle
                  </span>
                </div>
              )}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default PostDetail;

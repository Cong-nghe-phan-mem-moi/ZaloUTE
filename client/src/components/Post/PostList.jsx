import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  getNewsFeed,
  getPostsByAuthor,
  toggleLike,
  deletePost,
  resetPosts,
} from "../../redux/slices/postSlice";
import { formatDistanceToNow } from "date-fns";
import { enUS } from "date-fns/locale";
import LoadingSpinner from "../common/LoadingSpinner";
import PostDetail from "./PostDetail";
import EditPost from "./EditPost";
import SharePostModal from "./SharePostModal";
import SharedPostPreview from "./SharedPostPreview";
import PostEngagement from "./PostEngagement";
import { getPrivacyOption } from "../../utils/privacy";

const getUserId = (user) => user?.userId || user?._id || user?.id;

const getMediaGridClass = (count) => {
  if (count === 2) {
    return "grid-cols-2";
  }

  if (count === 3) {
    return "grid-cols-2";
  }

  return "grid-cols-6";
};

const getMediaTileClass = (count, index) => {
  if (count === 1) {
    return "max-h-[520px]";
  }

  if (count === 3 && index === 0) {
    return "col-span-2 aspect-[2/1]";
  }

  if (count >= 4 && index < 2) {
    return "col-span-3 aspect-square";
  }

  if (count >= 4) {
    return "col-span-2 aspect-square";
  }

  return "aspect-square";
};

const PostMediaPreview = ({ media }) => {
  const [singleImageOrientation, setSingleImageOrientation] = useState(null);

  if (!Array.isArray(media) || media.length === 0) {
    return null;
  }

  const visibleMedia = media.slice(0, 5);
  const remainingCount = media.length - visibleMedia.length;
  const isSingleMedia = media.length === 1;
  const isSingleImage = isSingleMedia && media[0]?.type === "image";
  const isSingleVideo = isSingleMedia && media[0]?.type !== "image";

  if (isSingleImage) {
    const imageClass =
      singleImageOrientation === "wide"
        ? "w-full max-h-[620px] object-contain"
        : "max-h-[680px] max-w-full object-contain";

    return (
      <div className="mb-3 flex w-full items-center justify-center overflow-hidden rounded-lg bg-[#f0f2f5]">
        <img
          src={media[0].url}
          alt="Post media"
          className={imageClass}
          onLoad={(event) => {
            const { naturalWidth, naturalHeight } = event.currentTarget;
            setSingleImageOrientation(
              naturalWidth >= naturalHeight ? "wide" : "tall",
            );
          }}
          onError={(event) => {
            event.target.style.display = "none";
          }}
        />
      </div>
    );
  }

  if (isSingleVideo) {
    return (
      <div className="mb-3 flex w-full items-center justify-center overflow-hidden rounded-lg bg-black">
        <video
          src={media[0].url}
          controls
          preload="metadata"
          className="max-h-[620px] w-full object-contain"
          onClick={(event) => event.stopPropagation()}
          onMouseDown={(event) => event.stopPropagation()}
          onError={(event) => {
            event.target.style.display = "none";
          }}
        />
      </div>
    );
  }

  return (
    <div className={`mb-3 grid gap-1 ${getMediaGridClass(media.length)}`}>
      {visibleMedia.map((item, index) => (
        <div
          key={`${item.url || "media"}-${index}`}
          className={`relative overflow-hidden bg-white ${getMediaTileClass(
            media.length,
            index,
          )}`}
        >
          {item.type === "image" ? (
            <img
              src={item.url}
              alt={`Post media ${index + 1}`}
              className="h-full w-full object-cover"
              onError={(event) => {
                event.target.style.display = "none";
              }}
            />
          ) : (
            <video
              src={item.url}
              controls
              preload="metadata"
              onClick={(event) => event.stopPropagation()}
              onMouseDown={(event) => event.stopPropagation()}
              className="h-full w-full object-cover"
              onError={(event) => {
                event.target.style.display = "none";
              }}
            />
          )}

          {remainingCount > 0 && index === visibleMedia.length - 1 ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/55 text-4xl font-bold text-white">
              +{remainingCount}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
};

const PostList = ({
  authorId = null,
  allowedAuthorIds = null,
  refreshKey = 0,
  initialSelectedPostId = null,
  focusedCommentId = null,
  focusedParentCommentId = null,
  emptyMessage = "No posts yet",
  emptyDetail = "Add friends to see their posts.",
  onPostsLoaded,
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { posts, loading, pagination } = useSelector(
    (state) => state.posts,
  );
  const currentUser = useSelector((state) => state.user?.profile);
  const [selectedPostId, setSelectedPostId] = useState(initialSelectedPostId);
  const [editingPostId, setEditingPostId] = useState(null);
  const [sharingPostId, setSharingPostId] = useState(null);
  const [page, setPage] = useState(1);

  const allowedAuthorIdSet = useMemo(() => {
    if (!Array.isArray(allowedAuthorIds)) {
      return null;
    }

    return new Set(allowedAuthorIds.map(String));
  }, [allowedAuthorIds]);

  const visiblePosts = useMemo(() => {
    if (!allowedAuthorIdSet) {
      return posts;
    }

    return posts.filter((post) =>
      allowedAuthorIdSet.has(String(post.author?._id)),
    );
  }, [allowedAuthorIdSet, posts]);

  useEffect(() => {
    onPostsLoaded?.(visiblePosts);
  }, [onPostsLoaded, visiblePosts]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1);
    }, 0);

    dispatch(resetPosts());

    if (authorId) {
      dispatch(getPostsByAuthor({ authorId, page: 1, limit: 10 }));
      return () => window.clearTimeout(timer);
    }

    dispatch(getNewsFeed({ page: 1, limit: 10 }));

    return () => window.clearTimeout(timer);
  }, [authorId, dispatch, refreshKey]);

  useEffect(() => {
    if (page === 1) {
      return;
    }

    if (authorId) {
      dispatch(getPostsByAuthor({ authorId, page, limit: 10 }));
      return;
    }

    dispatch(getNewsFeed({ page, limit: 10 }));
  }, [authorId, page, dispatch]);

  useEffect(() => {
    if (!initialSelectedPostId) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setSelectedPostId(initialSelectedPostId);
      window.history.replaceState(null, "", window.location.pathname);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [initialSelectedPostId, focusedCommentId, focusedParentCommentId]);

  const handleReaction = (postId, reactionType = "like") => {
    dispatch(toggleLike({ postId, reactionType }));
  };

  const handleDeletePost = (postId) => {
    if (window.confirm("Are you sure you want to delete this post?")) {
      dispatch(deletePost(postId));
    }
  };

  const handleLoadMore = () => {
    setPage((prev) => prev + 1);
  };

  const handleOpenAuthorProfile = (post) => {
    const authorProfileId = post.author?._id;
    if (!authorProfileId) return;

    const currentUserId = getUserId(currentUser);
    const profileUrl =
      currentUserId && String(currentUserId) === String(authorProfileId)
        ? "/profile"
        : `/users/profile/${authorProfileId}`;
    navigate(profileUrl);
  };

  const reloadCurrentList = () => {
    if (authorId) {
      dispatch(getPostsByAuthor({ authorId, page: 1, limit: page * 10 }));
      return;
    }

    dispatch(getNewsFeed({ page: 1, limit: page * 10 }));
  };

  if (loading && visiblePosts.length === 0) return <LoadingSpinner />;

  return (
    <div className="w-full space-y-4 pb-8">
      {visiblePosts.length === 0 ? (
        <div className="p-8 text-center text-gray-500 bg-white rounded-lg">
          <p className="text-lg">{emptyMessage}</p>
          <p className="text-sm mt-2">{emptyDetail}</p>
        </div>
      ) : (
        <>
          {visiblePosts.map((post) => {
            const privacyOption = getPrivacyOption(post.privacy?.type);
            return (
            <div
              key={post._id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <div className="flex items-center gap-3 flex-1">
                  <img
                    src={post.author?.avatar || "/default-avatar.svg"}
                    alt={post.author?.fullName}
                    className="w-12 h-12 rounded-full object-cover cursor-pointer hover:opacity-80"
                    onClick={() => handleOpenAuthorProfile(post)}
                  />
                  <div className="flex-1">
                    <h3
                      className="font-semibold text-gray-900 cursor-pointer hover:text-blue-600"
                      onClick={() => handleOpenAuthorProfile(post)}
                    >
                      {post.author?.fullName}
                    </h3>
                    <button
                      type="button"
                      className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
                      onClick={() => setSelectedPostId(post._id)}
                    >
                      <span>
                        {formatDistanceToNow(new Date(post.createdAt), {
                          addSuffix: true,
                          locale: enUS,
                        })}
                      </span>
                      <span className="material-symbols-outlined text-[15px]">
                        {privacyOption.icon}
                      </span>
                      <span className="sr-only">{privacyOption.label}</span>
                    </button>
                  </div>
                </div>

                {String(getUserId(currentUser)) === String(post.author?._id) && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingPostId(post._id)}
                      className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeletePost(post._id)}
                      className="text-gray-400 hover:text-red-600 p-1 rounded hover:bg-gray-100"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>

              <div
                className="p-4 cursor-pointer hover:bg-gray-50 transition"
                onClick={() => setSelectedPostId(post._id)}
              >
                {post.content ? (
                  <p className="text-gray-800 text-base leading-relaxed mb-3 line-clamp-5">
                    {post.content}
                  </p>
                ) : null}

                <PostMediaPreview media={post.media} />
                <SharedPostPreview
                  post={post.sharedFrom}
                  onOpen={setSelectedPostId}
                />
              </div>

              <PostEngagement
                post={post}
                onReact={(reactionType) => handleReaction(post._id, reactionType)}
                onComment={() => setSelectedPostId(post._id)}
                onShare={() => setSharingPostId(post._id)}
              />
            </div>
            );
          })}

          {pagination && pagination.page < pagination.totalPages && (
            <div className="text-center py-4">
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="px-8 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-lg font-medium transition"
              >
                {loading ? "Loading..." : "Load more"}
              </button>
            </div>
          )}
        </>
      )}

      <EditPost
        post={posts.find((post) => post._id === editingPostId)}
        isOpen={!!editingPostId}
        onClose={() => setEditingPostId(null)}
        onPostUpdated={() => {
          setEditingPostId(null);
          reloadCurrentList();
        }}
      />

      <PostDetail
        postId={selectedPostId}
        isOpen={!!selectedPostId}
        focusedCommentId={focusedCommentId}
        focusedParentCommentId={focusedParentCommentId}
        onClose={() => setSelectedPostId(null)}
      />

      <SharePostModal
        post={posts.find((post) => post._id === sharingPostId)}
        isOpen={!!sharingPostId}
        onClose={() => setSharingPostId(null)}
      />
    </div>
  );
};

export default PostList;

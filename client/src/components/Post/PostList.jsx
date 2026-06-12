import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getNewsFeed,
  getPostsByAuthor,
  toggleLike,
  deletePost,
  resetPosts,
} from "../../store/slices/postSlice";
import { formatDistanceToNow } from "date-fns";
import { enUS } from "date-fns/locale";
import LoadingSpinner from "../common/LoadingSpinner";
import PostDetail from "./PostDetail";
import EditPost from "./EditPost";

const getUserId = (user) => user?.userId || user?._id || user?.id;

const getMediaGridClass = (count) => {
  if (count === 2) {
    return "grid-cols-2";
  }

  return "grid-cols-2";
};

const getMediaTileClass = (count, index) => {
  if (count === 1) {
    return "max-h-[620px]";
  }

  if (count === 3 && index === 0) {
    return "col-span-2 h-80";
  }

  return "h-56";
};

const PostMediaPreview = ({ media }) => {
  if (!Array.isArray(media) || media.length === 0) {
    return null;
  }

  const visibleMedia = media.slice(0, 4);
  const remainingCount = media.length - visibleMedia.length;
  const isSingleImage = media.length === 1 && media[0]?.type === "image";

  if (isSingleImage) {
    return (
      <div className="mb-3 overflow-hidden rounded-lg bg-gray-100">
        <img
          src={media[0].url}
          alt="Post media"
          className="max-h-[620px] w-full object-cover"
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
          className={`relative overflow-hidden rounded-lg bg-gray-200 ${getMediaTileClass(
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
  emptyMessage = "No posts yet",
  emptyDetail = "Add friends to see their posts.",
}) => {
  const dispatch = useDispatch();
  const { posts, loading, pagination } = useSelector(
    (state) => state.posts,
  );
  const currentUser = useSelector((state) => state.user?.profile);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [editingPostId, setEditingPostId] = useState(null);
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

  const handleToggleLike = (postId) => {
    dispatch(toggleLike(postId));
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
    window.location.assign(profileUrl);
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
    <div className="max-w-4xl mx-auto space-y-4 pb-8">
      {visiblePosts.length === 0 ? (
        <div className="p-8 text-center text-gray-500 bg-white rounded-lg">
          <p className="text-lg">{emptyMessage}</p>
          <p className="text-sm mt-2">{emptyDetail}</p>
        </div>
      ) : (
        <>
          {visiblePosts.map((post) => (
            <div
              key={post._id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <div className="flex items-center gap-3 flex-1">
                  <img
                    src={post.author?.avatar || "/default-avatar.png"}
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
                    <p
                      className="text-sm text-gray-500 cursor-pointer hover:text-gray-700"
                      onClick={() => setSelectedPostId(post._id)}
                    >
                      {formatDistanceToNow(new Date(post.createdAt), {
                        addSuffix: true,
                        locale: enUS,
                      })}
                    </p>
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
              </div>

              <div className="px-4 py-2 border-t border-b border-gray-100 text-sm text-gray-600 flex justify-between">
                <button
                  onClick={() => setSelectedPostId(post._id)}
                  className="hover:text-blue-500 transition"
                >
                  {post.likes?.length || 0} likes
                </button>
                <button
                  onClick={() => setSelectedPostId(post._id)}
                  className="hover:text-blue-500 transition"
                >
                  {post.commentCount || 0} comments
                </button>
              </div>

              <div className="p-2 flex gap-1 text-gray-600">
                <button
                  onClick={() => handleToggleLike(post._id)}
                  className={`flex-1 py-2 rounded-lg transition flex items-center justify-center gap-2 font-medium ${
                    post.isLiked
                      ? "bg-blue-100 text-blue-600"
                      : "hover:bg-gray-100 text-gray-600"
                  }`}
                >
                  {post.isLiked ? "Unlike" : "Like"}
                </button>
                <button
                  onClick={() => setSelectedPostId(post._id)}
                  className="flex-1 py-2 rounded-lg hover:bg-gray-100 transition flex items-center justify-center gap-2 font-medium text-gray-600"
                >
                  Comment
                </button>
                <button className="flex-1 py-2 rounded-lg hover:bg-gray-100 transition flex items-center justify-center gap-2 font-medium text-gray-600">
                  Share
                </button>
              </div>
            </div>
          ))}

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
        onClose={() => setSelectedPostId(null)}
      />
    </div>
  );
};

export default PostList;

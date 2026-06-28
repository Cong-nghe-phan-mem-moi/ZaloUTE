import { useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Composer from "../../components/home/Composer";
import HomeHeader from "../../components/home/HomeHeader";
import LeftSidebar, {
  QuickAccessSection,
} from "../../components/home/LeftSidebar";
import RightSidebar from "../../components/home/RightSidebar";
import Stories from "../../components/home/Stories";
import { PostList } from "../../components/post";
import { useHomeSidebar } from "../../hooks";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";

export default function Home() {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const { profile } = useAppSelector((state) => state.user);
  const {
    contacts,
    feedRefreshKey,
    friendRequests,
    groupConversations,
    groupsLoading,
    handleAcceptRequest,
    handleContactClick,
    handleGroupClick,
    handleRejectRequest,
    requestActionId,
    requestsLoading,
  } = useHomeSidebar({ dispatch, profile });
  const postTarget = useMemo(() => {
    const params = new URLSearchParams(location.search);

    return {
      postId: params.get("postId"),
      commentId: params.get("commentId"),
      parentCommentId: params.get("parentCommentId"),
      storyId: params.get("storyId"),
    };
  }, [location.search]);

  const scrollToComposer = () => {
    const composer = document.getElementById("create-post-composer");
    if (!composer) return;

    composer.scrollIntoView({ behavior: "smooth", block: "start" });
    composer.querySelector("textarea")?.focus();
  };

  const handleMobileCreatePost = () => {
    if (location.pathname === "/" || location.pathname === "/home") {
      scrollToComposer();
      return;
    }

    navigate("/");
    window.setTimeout(scrollToComposer, 250);
  };

  return (
    <div className="min-h-screen bg-[#f2f3f5] text-[#111827]">
      <div className="min-h-screen w-full bg-white">
        <HomeHeader profile={profile} />

        <main className="grid min-h-[calc(100vh-80px)] grid-cols-1 justify-center bg-[#f2f3f5] lg:grid-cols-[240px_minmax(0,680px)] xl:grid-cols-[260px_minmax(0,680px)_300px] 2xl:grid-cols-[280px_minmax(0,760px)_320px]">
          <LeftSidebar profile={profile} />

          <section className="min-w-0 space-y-4 px-3 py-3 sm:px-4 sm:py-4 lg:space-y-5 lg:px-5 lg:py-5">
            <MobileHomePanels
              friendRequests={friendRequests}
              onCreatePost={handleMobileCreatePost}
            />
            <Stories profile={profile} initialStoryId={postTarget.storyId} />
            <Composer profile={profile} />
            <PostList
              refreshKey={feedRefreshKey}
              initialSelectedPostId={postTarget.postId}
              focusedCommentId={postTarget.commentId}
              focusedParentCommentId={postTarget.parentCommentId}
              emptyMessage="No posts from friends yet"
              emptyDetail="The home feed only shows posts from your friends."
            />
          </section>

          <RightSidebar
            contacts={contacts}
            friendRequests={friendRequests}
            groupConversations={groupConversations}
            groupsLoading={groupsLoading}
            requestsLoading={requestsLoading}
            requestActionId={requestActionId}
            onAcceptRequest={handleAcceptRequest}
            onRejectRequest={handleRejectRequest}
            onContactClick={handleContactClick}
            onGroupClick={handleGroupClick}
          />
        </main>
      </div>
    </div>
  );
}

const mobileActions = [
  { icon: "group", label: "Friends", href: "/friends" },
  { icon: "groups", label: "Groups", href: "/groups" },
  { icon: "photo_library", label: "Media", href: "/profile/media" },
  { icon: "settings", label: "Settings", href: "/account/settings" },
];

const MobileHomePanels = ({ friendRequests, onCreatePost }) => (
  <div className="space-y-3 lg:hidden">
    <section className="rounded-lg bg-white p-3 shadow-sm">
      <div className="grid grid-cols-5 gap-2">
        <button
          type="button"
          onClick={onCreatePost}
          className="flex min-w-0 flex-col items-center gap-1 rounded-lg px-1 py-2 text-xs font-semibold text-[#0b66c3] hover:bg-[#f2f3f5]"
        >
          <span className="material-symbols-outlined text-[22px]">edit_square</span>
          <span className="truncate">Post</span>
        </button>
        {mobileActions.map((action) => (
          <Link
            key={action.label}
            to={action.href}
            className="flex min-w-0 flex-col items-center gap-1 rounded-lg px-1 py-2 text-xs font-semibold text-[#0b66c3] hover:bg-[#f2f3f5]"
          >
            <span className="material-symbols-outlined text-[22px]">
              {action.icon}
            </span>
            <span className="truncate">{action.label}</span>
          </Link>
        ))}
      </div>
    </section>

    <QuickAccessSection compact />

    {friendRequests.length > 0 ? (
      <Link
        to="/friend-requests"
        className="flex items-center justify-between gap-3 rounded-lg bg-white p-4 text-sm font-semibold shadow-sm hover:bg-[#f8fafc]"
      >
        <span className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e7f3ff] text-[#1877f2]">
            <span className="material-symbols-outlined text-[20px]">
              group_add
            </span>
          </span>
          <span className="min-w-0">
            <span className="block truncate">Friend requests</span>
            <span className="block text-xs text-[#6b7280]">
              {friendRequests.length} waiting
            </span>
          </span>
        </span>
        <span className="material-symbols-outlined text-[20px] text-[#6b7280]">
          chevron_right
        </span>
      </Link>
    ) : null}
  </div>
);

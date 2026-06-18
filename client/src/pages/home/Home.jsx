import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import Composer from "../../components/home/Composer";
import HomeHeader from "../../components/home/HomeHeader";
import LeftSidebar from "../../components/home/LeftSidebar";
import RightSidebar from "../../components/home/RightSidebar";
import Stories from "../../components/home/Stories";
import { PostList } from "../../components/post";
import { useHomeSidebar } from "../../hooks";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";

export default function Home() {
  const dispatch = useAppDispatch();
  const location = useLocation();
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

  return (
    <div className="min-h-screen bg-[#f2f3f5] text-[#111827]">
      <div className="min-h-screen w-full bg-white">
        <HomeHeader profile={profile} />

        <main className="grid min-h-[calc(100vh-80px)] grid-cols-1 bg-[#f2f3f5] lg:grid-cols-[280px_minmax(0,1fr)_320px]">
          <LeftSidebar profile={profile} />

          <section className="space-y-5 px-5 py-5">
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

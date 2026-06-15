import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import Composer from "../components/home/Composer";
import HomeHeader from "../components/home/HomeHeader";
import LeftSidebar from "../components/home/LeftSidebar";
import RightSidebar from "../components/home/RightSidebar";
import Stories from "../components/home/Stories";
import { PostList } from "../components/Post";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchUserProfile } from "../store/slices/userSlice";
import { userAPI } from "../services/api";

export default function Home() {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const { profile } = useAppSelector((state) => state.user);
  const [friendRequests, setFriendRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestActionId, setRequestActionId] = useState("");
  const [feedRefreshKey, setFeedRefreshKey] = useState(0);
  const postTarget = useMemo(() => {
    const params = new URLSearchParams(location.search);

    return {
      postId: params.get("postId"),
      commentId: params.get("commentId"),
      parentCommentId: params.get("parentCommentId"),
    };
  }, [location.search]);

  const loadFriendRequests = useCallback(async () => {
    setRequestsLoading(true);

    try {
      const response = await userAPI.getIncomingFriendRequests();
      setFriendRequests(response.data?.data || []);
    } catch (error) {
      console.error("Unable to load friend requests:", error);
      setFriendRequests([]);
    } finally {
      setRequestsLoading(false);
    }
  }, []);

  useEffect(() => {
    dispatch(fetchUserProfile());

    const timer = window.setTimeout(() => {
      loadFriendRequests();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [dispatch, loadFriendRequests]);

  const refreshSidebarData = async () => {
    await Promise.all([dispatch(fetchUserProfile()), loadFriendRequests()]);
  };

  const handleAcceptRequest = async (senderId) => {
    if (!senderId || requestActionId) return;

    setRequestActionId(senderId);

    try {
      await userAPI.acceptFriendRequest(senderId);
      await refreshSidebarData();
      setFeedRefreshKey((key) => key + 1);
    } catch (error) {
      console.error("Unable to accept friend request:", error);
    } finally {
      setRequestActionId("");
    }
  };

  const handleRejectRequest = async (senderId) => {
    if (!senderId || requestActionId) return;

    setRequestActionId(senderId);

    try {
      await userAPI.rejectFriendRequest(senderId);
      await refreshSidebarData();
    } catch (error) {
      console.error("Unable to reject friend request:", error);
    } finally {
      setRequestActionId("");
    }
  };

  const contacts = useMemo(() => {
    if (!Array.isArray(profile?.friends) || profile.friends.length === 0) {
      return [];
    }

    return profile.friends.map((friend) => ({
      id: friend?.userId || friend?._id || friend?.id || friend,
      name: friend?.fullName || friend?.name || "Friend",
      avatar: friend?.avatar || friend?.image || null,
      status: friend?.isOnline ? "Online" : "View profile",
      online: friend?.isOnline || false,
    }));
  }, [profile]);

  const friendIds = useMemo(() => {
    if (!Array.isArray(profile?.friends)) {
      return [];
    }

    return profile.friends
      .map((friend) => friend?.userId || friend?._id || friend?.id || friend)
      .filter(Boolean);
  }, [profile]);

  return (
    <div className="min-h-screen bg-[#f2f3f5] text-[#111827]">
      <div className="min-h-screen w-full bg-white">
        <HomeHeader profile={profile} />

        <main className="grid min-h-[calc(100vh-80px)] grid-cols-1 bg-[#f2f3f5] lg:grid-cols-[280px_minmax(0,1fr)_320px]">
          <LeftSidebar profile={profile} />

          <section className="space-y-5 px-5 py-5">
            <Stories />
            <Composer profile={profile} />
            <PostList
              allowedAuthorIds={friendIds}
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
            requestsLoading={requestsLoading}
            requestActionId={requestActionId}
            onAcceptRequest={handleAcceptRequest}
            onRejectRequest={handleRejectRequest}
          />
        </main>
      </div>
    </div>
  );
}

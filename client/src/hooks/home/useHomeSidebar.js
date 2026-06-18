import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchUserProfile } from "../../redux/slices/userSlice";
import { userAPI } from "../../services/user.service";

export const useHomeSidebar = ({ dispatch, profile }) => {
  const [friendRequests, setFriendRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestActionId, setRequestActionId] = useState("");
  const [feedRefreshKey, setFeedRefreshKey] = useState(0);

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

  const handleContactClick = useCallback((contact) => {
    window.dispatchEvent(
      new CustomEvent("zalo-open-mini-chat", { detail: contact }),
    );
  }, []);

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

  return {
    contacts,
    feedRefreshKey,
    friendIds,
    friendRequests,
    handleAcceptRequest,
    handleContactClick,
    handleRejectRequest,
    requestActionId,
    requestsLoading,
  };
};

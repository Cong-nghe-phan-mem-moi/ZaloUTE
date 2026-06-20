import { useCallback, useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { fetchUserProfile, updateUserProfile } from "../../redux/slices/userSlice";
import { userAPI } from "../../services/user.service";
import Composer from "../../components/home/Composer";
import HomeHeader from "../../components/home/HomeHeader";
import ProfileHeader from "../../components/profile/ProfileHeader";
import FriendsGrid from "../../components/profile/FriendsGrid";
import EditProfileModal from "../../components/profile/EditProfileModal";
import FAB from "../../components/common/FAB";
import StatusCard from "../../components/common/StatusCard";
import ProfileTabs from "../../components/profile/ProfileTabs";
import ProfileImagePreviewModal from "../../components/profile/ProfileImagePreviewModal";
import ProfileAboutTab from "../../components/profile/ProfileAboutTab";
import ProfileMediaTab from "../../components/profile/ProfileMediaTab";
import { PostList } from "../../components/post";
import ReportModal from "../../components/report/ReportModal";

const getProfileId = (profile) =>
  profile?.userId || profile?._id || profile?.id;

const getActionMessage = (response, fallback) => {
  const message = response?.data?.message;

  if (!message || message === "Operation failed") {
    return fallback;
  }

  return message;
};

const getActionErrorMessage = (error, fallback) => {
  const message = error?.response?.data?.message;

  if (!message || message === "Operation failed") {
    return fallback;
  }

  return message;
};

const ProfilePage = ({ userId }) => {
  const dispatch = useAppDispatch();
  const { profile, loading, error } = useAppSelector((state) => state.user);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [otherProfile, setOtherProfile] = useState(null);
  const [otherLoading, setOtherLoading] = useState(false);
  const [otherError, setOtherError] = useState("");
  const [friendRequestLoading, setFriendRequestLoading] = useState(false);
  const [acceptRequestLoading, setAcceptRequestLoading] = useState(false);
  const [rejectRequestLoading, setRejectRequestLoading] = useState(false);
  const [cancelRequestLoading, setCancelRequestLoading] = useState(false);
  const [unfriendLoading, setUnfriendLoading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [blockingUser, setBlockingUser] = useState(false);
  const [unblockingUser, setUnblockingUser] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [activeTab, setActiveTab] = useState("introduction");
  const [previewState, setPreviewState] = useState({
    open: false,
    image: null,
    title: "",
  });
  const [profilePosts, setProfilePosts] = useState([]);
  const [reportTarget, setReportTarget] = useState(null);

  const isOwnProfile = !userId;
  const currentProfile = isOwnProfile ? profile : otherProfile;

  const loadOtherProfile = useCallback(async () => {
    if (!userId) {
      return;
    }

    setOtherLoading(true);
    setOtherError("");

    try {
      const response = await userAPI.getOtherProfile(userId);
      setOtherProfile(response.data?.data || null);
    } catch (err) {
      setOtherProfile(null);
      setOtherError(err.response?.data?.message || "Unable to load profile.");
    } finally {
      setOtherLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    dispatch(fetchUserProfile());
  }, [dispatch]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setNotice("");
      loadOtherProfile();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadOtherProfile]);

  const refreshProfilesAfterAction = useCallback(async () => {
    await Promise.all([dispatch(fetchUserProfile()), loadOtherProfile()]);
  }, [dispatch, loadOtherProfile]);

  const handleSaveProfile = async (formData) => {
    try {
      await dispatch(updateUserProfile(formData)).unwrap();
      setIsEditModalOpen(false);
    } catch (err) {
      console.error("Failed to update profile:", err);
    }
  };

  const handleUploadAvatar = async (file) => {
    if (!file || avatarUploading) return;

    setAvatarUploading(true);
    setNotice("");

    try {
      const response = await userAPI.uploadAvatar(file);
      await dispatch(fetchUserProfile());
      setNotice(getActionMessage(response, "Avatar uploaded successfully."));
    } catch (err) {
      setNotice(getActionErrorMessage(err, "Unable to upload avatar."));
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleUploadCoverImage = async (file) => {
    if (!file || coverUploading) return;

    setCoverUploading(true);
    setNotice("");

    try {
      const response = await userAPI.uploadCoverImage(file);
      await dispatch(fetchUserProfile());
      setNotice(
        getActionMessage(response, "Cover image uploaded successfully."),
      );
    } catch (err) {
      setNotice(getActionErrorMessage(err, "Unable to upload cover image."));
    } finally {
      setCoverUploading(false);
    }
  };

  const handleSendFriendRequest = async () => {
    const receiverId = getProfileId(otherProfile);
    if (!receiverId || friendRequestLoading) return;

    setFriendRequestLoading(true);
    setNotice("");

    try {
      const response = await userAPI.sendFriendRequest(receiverId);
      await refreshProfilesAfterAction();
      setNotice(getActionMessage(response, "Friend request sent."));
    } catch (err) {
      setNotice(getActionErrorMessage(err, "Unable to send friend request."));
    } finally {
      setFriendRequestLoading(false);
    }
  };

  const handleAcceptFriendRequest = async () => {
    const senderId = getProfileId(otherProfile);
    if (!senderId || acceptRequestLoading) return;

    setAcceptRequestLoading(true);
    setNotice("");

    try {
      const response = await userAPI.acceptFriendRequest(senderId);
      await refreshProfilesAfterAction();
      setNotice(getActionMessage(response, "Friend request accepted."));
    } catch (err) {
      setNotice(getActionErrorMessage(err, "Unable to accept friend request."));
    } finally {
      setAcceptRequestLoading(false);
    }
  };

  const handleRejectFriendRequest = async () => {
    const senderId = getProfileId(otherProfile);
    if (!senderId || rejectRequestLoading) return;

    setRejectRequestLoading(true);
    setNotice("");

    try {
      const response = await userAPI.rejectFriendRequest(senderId);
      await refreshProfilesAfterAction();
      setNotice(getActionMessage(response, "Friend request rejected."));
    } catch (err) {
      setNotice(getActionErrorMessage(err, "Unable to reject friend request."));
    } finally {
      setRejectRequestLoading(false);
    }
  };

  const handleCancelFriendRequest = async () => {
    const receiverId = getProfileId(otherProfile);
    if (!receiverId || cancelRequestLoading) return;

    setCancelRequestLoading(true);
    setNotice("");

    try {
      const response = await userAPI.cancelFriendRequest(receiverId);
      await refreshProfilesAfterAction();
      setNotice(getActionMessage(response, "Friend request cancelled."));
    } catch (err) {
      setNotice(getActionErrorMessage(err, "Unable to cancel friend request."));
    } finally {
      setCancelRequestLoading(false);
    }
  };

  const handleUnfriend = async () => {
    const friendId = getProfileId(otherProfile);
    if (!friendId || unfriendLoading) return;

    setUnfriendLoading(true);
    setNotice("");

    try {
      const response = await userAPI.unfriend(friendId);
      await refreshProfilesAfterAction();
      setNotice(getActionMessage(response, "Friend removed."));
    } catch (err) {
      setNotice(getActionErrorMessage(err, "Unable to unfriend."));
    } finally {
      setUnfriendLoading(false);
    }
  };

  const handleBlockUser = async () => {
    const targetId = getProfileId(otherProfile);
    if (!targetId || blockingUser) return;

    setBlockingUser(true);
    setNotice("");

    try {
      const response = await userAPI.blockUser(targetId);
      await refreshProfilesAfterAction();
      setNotice(getActionMessage(response, "User blocked successfully."));
    } catch (err) {
      setNotice(getActionErrorMessage(err, "Unable to block user."));
    } finally {
      setBlockingUser(false);
    }
  };

  const handleUnblockUser = async () => {
    const targetId = getProfileId(otherProfile);
    if (!targetId || unblockingUser) return;

    setUnblockingUser(true);
    setNotice("");

    try {
      const response = await userAPI.unblockUser(targetId);
      await refreshProfilesAfterAction();
      setNotice(getActionMessage(response, "User unblocked successfully."));
    } catch (err) {
      setNotice(getActionErrorMessage(err, "Unable to unblock user."));
    } finally {
      setUnblockingUser(false);
    }
  };

  const handleToggleFollow = async () => {
    const targetId = getProfileId(otherProfile);
    if (!targetId || followLoading) return;

    setFollowLoading(true);
    setNotice("");

    try {
      const response = await userAPI.toggleFollowUser(targetId);
      await refreshProfilesAfterAction();
      const isFollowing = response.data?.data?.isFollowing;
      setNotice(isFollowing ? "Following user." : "Unfollowed user.");
    } catch (err) {
      setNotice(getActionErrorMessage(err, "Unable to update follow status."));
    } finally {
      setFollowLoading(false);
    }
  };

  const openPreview = (image, title) => {
    if (!image) return;
    setPreviewState({ open: true, image, title });
  };

  const closePreview = () => {
    setPreviewState({ open: false, image: null, title: "" });
  };

  const displayProfile = useMemo(() => {
    const source = currentProfile || {};
    const name = source.fullName || "ZaloUTE User";
    const email = source.email || source.account?.email || "";
    const friendsCount = source.friendsCount ?? source.friends?.length ?? 0;
    const mediaCount = profilePosts.reduce(
      (total, post) =>
        total + (Array.isArray(post.media) ? post.media.length : 0),
      0,
    );

    return {
      name,
      username: email
        ? `@${email.split("@")[0]}`
        : `@${name.toLowerCase().replace(/\s+/g, "")}`,
      bio: source.bio || (isOwnProfile ? "" : "No bio yet."),
      coverImage: source.coverImage || null,
      profileImage: source.avatar || null,
      stats: {
        friends: friendsCount,
        posts: profilePosts.length,
        photos: mediaCount,
      },
      isOnline: source.isOnline || false,
      relation: source.relation || "none",
      isFollowedByMe: Boolean(source.isFollowedByMe),
    };
  }, [currentProfile, isOwnProfile, profilePosts]);

  const friendsData = useMemo(() => {
    const sourceFriends = currentProfile?.friends;

    if (!Array.isArray(sourceFriends)) {
      return [];
    }

    return sourceFriends
      .map((friend) => ({
        id: friend?.id || friend?._id || friend?.userId || friend,
        name: friend?.fullName || friend?.name || "Friend",
        image: friend?.avatar || friend?.image || null,
      }))
      .filter((friend) => friend.id);
  }, [currentProfile]);
  const pageLoading = isOwnProfile
    ? loading && !profile
    : otherLoading && !otherProfile;
  const pageError = isOwnProfile ? error : otherError;
  const postAuthorId = getProfileId(currentProfile);
  const isBlocked = Array.isArray(profile?.blockedUsers)
    ? profile.blockedUsers.some(
        (item) => String(item.id || item._id || item) === String(userId),
      )
    : false;

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-[#f2f3f5] text-[#111827]">
        <div className="flex min-h-screen w-full items-center justify-center bg-[#f2f3f5]">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-[#1877f2] border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f2f3f5] text-[#111827]">
      <div className="min-h-screen w-full bg-white">
        <HomeHeader profile={profile} activePage={null} />

        <main className="min-h-[calc(100vh-80px)] bg-[#f2f3f5] px-4 py-5 lg:px-6">
          <div className="mx-auto w-full max-w-[70vw] space-y-5">
            {pageError ? (
              <StatusCard
                icon="error"
                tone="error"
                message={
                  typeof pageError === "string"
                    ? pageError
                    : pageError.message || "Error occurred"
                }
                layout="inline"
              />
            ) : null}

            {notice ? (
              <StatusCard icon="info" message={notice} layout="inline" />
            ) : null}

            <ProfileHeader
              profileData={displayProfile}
              onEdit={() => setIsEditModalOpen(true)}
              isOwnProfile={isOwnProfile}
              onUploadAvatar={handleUploadAvatar}
              avatarUploading={avatarUploading}
              onUploadCoverImage={handleUploadCoverImage}
              coverUploading={coverUploading}
              onSendFriendRequest={handleSendFriendRequest}
              sendingFriendRequest={friendRequestLoading}
              onAcceptFriendRequest={handleAcceptFriendRequest}
              acceptingFriendRequest={acceptRequestLoading}
              onRejectFriendRequest={handleRejectFriendRequest}
              rejectingFriendRequest={rejectRequestLoading}
              onCancelFriendRequest={handleCancelFriendRequest}
              cancellingFriendRequest={cancelRequestLoading}
              onUnfriend={handleUnfriend}
              unfriending={unfriendLoading}
              onPreviewAvatar={() =>
                openPreview(displayProfile.profileImage, "Profile photo")
              }
              onPreviewCover={() =>
                openPreview(displayProfile.coverImage, "Cover photo")
              }
              onBlockUser={handleBlockUser}
              onUnblockUser={handleUnblockUser}
              blockingUser={blockingUser}
              unblockingUser={unblockingUser}
              isBlocked={isBlocked}
              isFollowing={displayProfile.isFollowedByMe}
              onToggleFollow={handleToggleFollow}
              followLoading={followLoading}
              onReportUser={() =>
                setReportTarget({ type: "User", id: getProfileId(otherProfile) })
              }
            />

            <ProfileTabs activeTab={activeTab} onChange={setActiveTab} />

            {activeTab === "introduction" ? (
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(240px,30%)_minmax(0,70%)]">
                <div>
                  <ProfileAboutTab
                    profile={currentProfile}
                    showSocialLinks={false}
                  />
                </div>

                <div className="space-y-5">
                  {isOwnProfile ? <Composer profile={profile} /> : null}
                  {postAuthorId ? (
                    <PostList
                      authorId={postAuthorId}
                      emptyMessage="No posts yet"
                      emptyDetail="Posts from this account will appear here."
                      onPostsLoaded={setProfilePosts}
                    />
                  ) : null}
                </div>
              </div>
            ) : null}

            {activeTab === "posts" ? (
              <div className="space-y-5">
                {isOwnProfile ? <Composer profile={profile} /> : null}
                {postAuthorId ? (
                  <PostList
                    authorId={postAuthorId}
                    emptyMessage="No posts yet"
                    emptyDetail="Posts from this account will appear here."
                    onPostsLoaded={setProfilePosts}
                  />
                ) : null}
              </div>
            ) : null}

            {activeTab === "about" ? (
              <ProfileAboutTab profile={currentProfile} />
            ) : null}

            {activeTab === "media" ? (
              <ProfileMediaTab posts={profilePosts} />
            ) : null}

            {activeTab === "friends" ? (
              <FriendsGrid
                friends={friendsData}
                totalFriends={displayProfile.stats.friends}
              />
            ) : null}
          </div>
        </main>
      </div>

      {isOwnProfile ? (
        <>
          <EditProfileModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            onSave={handleSaveProfile}
            initialData={profile}
          />
          <FAB icon="add" label="Post Update" />
        </>
      ) : null}

      <ProfileImagePreviewModal
        isOpen={previewState.open}
        image={previewState.image}
        title={previewState.title}
        onClose={closePreview}
      />

      <ReportModal
        target={reportTarget}
        onClose={() => setReportTarget(null)}
        onSubmitted={() => setNotice("Report submitted.")}
      />
    </div>
  );
};

export default ProfilePage;

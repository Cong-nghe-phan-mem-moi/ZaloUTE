import { useCallback, useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchUserProfile, updateUserProfile } from "../store/slices/userSlice";
import { userAPI } from "../services/api";
import Composer from "../components/home/Composer";
import HomeHeader from "../components/home/HomeHeader";
import ProfileHeader from "../components/profile/ProfileHeader";
import FriendsGrid from "../components/profile/FriendsGrid";
import AboutCard from "../components/profile/AboutCard";
import RecentActivityCard from "../components/profile/RecentActivityCard";
import EditProfileModal from "../components/profile/EditProfileModal";
import FAB from "../components/common/FAB";
import { PostList } from "../components/Post";

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
  const [notice, setNotice] = useState("");

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
      setOtherError(
        err.response?.data?.message || "Unable to load profile.",
      );
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
      setNotice(getActionMessage(response, "Cover image uploaded successfully."));
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

  const displayProfile = useMemo(() => {
    const source = currentProfile || {};
    const name = source.fullName || "ZaloUTE User";
    const email = source.email || source.account?.email || "";
    const friendsCount = source.friendsCount ?? source.friends?.length ?? 0;

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
        posts: 0,
        photos: 0,
      },
      isOnline: source.isOnline || false,
      relation: source.relation || "none",
    };
  }, [currentProfile, isOwnProfile]);

  const aboutData = useMemo(() => {
    const source = currentProfile || {};

    return [
      {
        icon: "call",
        title: "Phone Number",
        value: source.phone || "Not updated",
      },
      {
        icon: "person",
        title: "Gender",
        value: source.gender || "Not updated",
      },
      {
        icon: "cake",
        title: "Birthday",
        value: source.dateOfBirth
          ? new Date(source.dateOfBirth).toLocaleDateString()
          : "Not updated",
      },
      {
        icon: "location_on",
        title: "Lives in",
        value: source.address || "Not updated",
      },
      {
        icon: "history",
        title: "Member since",
        value: source.createdAt
          ? `Joined ${new Date(source.createdAt).toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}`
          : "Not updated",
      },
    ];
  }, [currentProfile]);

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
  const activities = [];
  const pageLoading = isOwnProfile
    ? loading && !profile
    : otherLoading && !otherProfile;
  const pageError = isOwnProfile ? error : otherError;
  const postAuthorId = getProfileId(currentProfile);

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

        <main className="min-h-[calc(100vh-80px)] bg-[#f2f3f5] px-5 py-5">
          <div className="w-full space-y-5">
            {pageError ? (
              <StatusCard
                icon="error"
                tone="error"
                message={
                  typeof pageError === "string"
                    ? pageError
                    : pageError.message || "Error occurred"
                }
              />
            ) : null}

            {notice ? (
              <StatusCard icon="info" message={notice} />
            ) : null}

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
              <div className="space-y-5 lg:col-span-8">
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
                />
                <FriendsGrid
                  friends={friendsData}
                  totalFriends={displayProfile.stats.friends}
                />
                {isOwnProfile ? <Composer profile={profile} /> : null}
                {postAuthorId ? (
                  <PostList
                    authorId={postAuthorId}
                    emptyMessage="No posts yet"
                    emptyDetail="Posts from this account will appear here."
                  />
                ) : null}
              </div>

              <div className="space-y-5 lg:col-span-4">
                <AboutCard aboutData={aboutData} />
                <RecentActivityCard activities={activities} />
                <div className="px-2">
                  <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-[#6b7280]">
                    <a className="hover:underline" href="#">
                      Privacy
                    </a>
                    <a className="hover:underline" href="#">
                      Terms
                    </a>
                    <a className="hover:underline" href="#">
                      Cookies
                    </a>
                    <span>ZaloUTE 2026</span>
                  </div>
                </div>
              </div>
            </div>
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
    </div>
  );
};

const StatusCard = ({ icon, message, tone = "neutral" }) => (
  <section
    className={`flex items-center gap-3 rounded bg-white p-4 text-sm font-semibold shadow-sm ${
      tone === "error" ? "text-red-600" : "text-[#111827]"
    }`}
  >
    <span
      className={`material-symbols-outlined text-[20px] ${
        tone === "error" ? "" : "text-[#1877f2]"
      }`}
    >
      {icon}
    </span>
    <span>{message}</span>
  </section>
);

export default ProfilePage;

import { useEffect, useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchUserProfile, updateUserProfile } from '../store/slices/userSlice';
import { userAPI } from '../services/api';
import TopAppBar from '../components/layout/TopAppBar';
import ProfileHeader from '../components/profile/ProfileHeader';
import FriendsGrid from '../components/profile/FriendsGrid';
import AboutCard from '../components/profile/AboutCard';
import RecentActivityCard from '../components/profile/RecentActivityCard';
import EditProfileModal from '../components/profile/EditProfileModal';
import FAB from '../components/common/FAB';

const getProfileId = (profile) => profile?.userId || profile?._id || profile?.id;

const ProfilePage = ({ userId }) => {
  const dispatch = useAppDispatch();
  const { profile, loading, error } = useAppSelector((state) => state.user);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [otherProfile, setOtherProfile] = useState(null);
  const [otherLoading, setOtherLoading] = useState(false);
  const [otherError, setOtherError] = useState('');
  const [friendRequestLoading, setFriendRequestLoading] = useState(false);
  const [acceptRequestLoading, setAcceptRequestLoading] = useState(false);
  const [notice, setNotice] = useState('');

  const isOwnProfile = !userId;
  const currentProfile = isOwnProfile ? profile : otherProfile;

  useEffect(() => {
    dispatch(fetchUserProfile());
  }, [dispatch]);

  useEffect(() => {
    if (!userId) {
      return;
    }

    let isCurrent = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOtherLoading(true);
    setOtherError('');
    setNotice('');

    userAPI
      .getOtherProfile(userId)
      .then((response) => {
        if (isCurrent) {
          setOtherProfile(response.data?.data || null);
        }
      })
      .catch((err) => {
        if (isCurrent) {
          setOtherProfile(null);
          setOtherError(err.response?.data?.message || 'Khong the tai trang ca nhan.');
        }
      })
      .finally(() => {
        if (isCurrent) {
          setOtherLoading(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [userId]);

  const handleSaveProfile = async (formData) => {
    try {
      await dispatch(updateUserProfile(formData)).unwrap();
      setIsEditModalOpen(false);
    } catch (err) {
      console.error('Failed to update profile:', err);
    }
  };

  const handleSendFriendRequest = async () => {
    const receiverId = getProfileId(otherProfile);
    if (!receiverId || friendRequestLoading) return;

    setFriendRequestLoading(true);
    setNotice('');

    try {
      const response = await userAPI.sendFriendRequest(receiverId);
      setOtherProfile((current) =>
        current ? { ...current, relation: 'sent_request' } : current,
      );
      setNotice(response.data?.message || 'Friend request sent.');
    } catch (err) {
      setNotice(err.response?.data?.message || 'Khong the gui loi moi ket ban.');
    } finally {
      setFriendRequestLoading(false);
    }
  };

  const handleAcceptFriendRequest = async () => {
    const senderId = getProfileId(otherProfile);
    if (!senderId || acceptRequestLoading) return;

    setAcceptRequestLoading(true);
    setNotice('');

    try {
      const response = await userAPI.acceptFriendRequest(senderId);
      const myId = getProfileId(profile);

      setOtherProfile((current) => {
        if (!current) return current;

        const currentFriends = Array.isArray(current.friends) ? current.friends : null;
        const nextFriends =
          currentFriends && myId && !currentFriends.some((friendId) => friendId?.toString() === myId?.toString())
            ? [...currentFriends, myId]
            : currentFriends;

        return {
          ...current,
          relation: 'friend',
          friends: nextFriends || current.friends,
          friendsCount:
            typeof current.friendsCount === 'number'
              ? current.friendsCount + 1
              : current.friendsCount,
        };
      });

      setNotice(response.data?.message || 'Friend request accepted.');
    } catch (err) {
      setNotice(err.response?.data?.message || 'Khong the chap nhan loi moi ket ban.');
    } finally {
      setAcceptRequestLoading(false);
    }
  };

  const displayProfile = useMemo(() => {
    const source = currentProfile || {};
    const name = source.fullName || 'ZaloUTE User';
    const email = source.email || source.account?.email || '';
    const friendsCount = source.friendsCount ?? source.friends?.length ?? 0;

    return {
      name,
      username: email ? `@${email.split('@')[0]}` : `@${name.toLowerCase().replace(/\s+/g, '')}`,
      bio: source.bio || (isOwnProfile ? '' : 'No bio yet.'),
      coverImage: source.coverImage || null,
      profileImage: source.avatar || null,
      stats: {
        friends: friendsCount,
        posts: 0,
        photos: 0,
      },
      isOnline: source.isOnline || false,
      relation: source.relation || 'none',
    };
  }, [currentProfile, isOwnProfile]);

  const aboutData = useMemo(() => {
    const source = currentProfile || {};

    return [
      { icon: 'call', title: 'Phone Number', value: source.phone || 'Not updated' },
      { icon: 'person', title: 'Gender', value: source.gender || 'Not updated' },
      {
        icon: 'cake',
        title: 'Birthday',
        value: source.dateOfBirth ? new Date(source.dateOfBirth).toLocaleDateString() : 'Not updated',
      },
      { icon: 'location_on', title: 'Lives in', value: source.address || 'Not updated' },
      {
        icon: 'history',
        title: 'Member since',
        value: source.createdAt
          ? `Joined ${new Date(source.createdAt).toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric',
            })}`
          : 'Not updated',
      },
    ];
  }, [currentProfile]);

  const friendsData = [];
  const activities = [];
  const pageLoading = isOwnProfile ? loading && !profile : otherLoading && !otherProfile;
  const pageError = isOwnProfile ? error : otherError;

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f0f2f5]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1877f2]"></div>
      </div>
    );
  }

  return (
    <div className="bg-[#f0f2f5] text-[#050505] min-h-screen">
      <TopAppBar profile={profile} />
      <main className="mx-auto px-4 py-6 max-w-6xl">
        {pageError ? (
          <div className="mb-4 bg-white text-red-600 p-4 rounded-lg border border-red-100 flex items-center gap-3 shadow-sm">
            <span className="material-symbols-outlined">error</span>
            <span>{typeof pageError === 'string' ? pageError : pageError.message || 'Error occurred'}</span>
          </div>
        ) : null}

        {notice ? (
          <div className="mb-4 bg-white text-[#050505] p-4 rounded-lg border border-[#dddfe2] flex items-center gap-3 shadow-sm">
            <span className="material-symbols-outlined text-[#1877f2]">info</span>
            <span>{notice}</span>
          </div>
        ) : null}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-8 space-y-4">
            <ProfileHeader
              profileData={displayProfile}
              onEdit={() => setIsEditModalOpen(true)}
              isOwnProfile={isOwnProfile}
              onSendFriendRequest={handleSendFriendRequest}
              sendingFriendRequest={friendRequestLoading}
              onAcceptFriendRequest={handleAcceptFriendRequest}
              acceptingFriendRequest={acceptRequestLoading}
            />
            <ComposerCard profile={profile} />
            <FriendsGrid friends={friendsData} totalFriends={displayProfile.stats.friends} />
          </div>

          <div className="lg:col-span-4 space-y-4">
            <AboutCard aboutData={aboutData} />
            <RecentActivityCard activities={activities} />
            <div className="px-2">
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-[#65676b] text-xs">
                <a className="hover:underline" href="#">Privacy</a>
                <a className="hover:underline" href="#">Terms</a>
                <a className="hover:underline" href="#">Cookies</a>
                <span>ZaloUTE 2026</span>
              </div>
            </div>
          </div>
        </div>
      </main>

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

const ComposerCard = ({ profile }) => (
  <div className="bg-white rounded-lg shadow-sm border border-[#dddfe2] p-4">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-[#e4e6eb] overflow-hidden flex items-center justify-center text-[#65676b]">
        {profile?.avatar ? (
          <img className="w-full h-full object-cover" src={profile.avatar} alt={profile.fullName || 'Profile'} />
        ) : (
          <span className="material-symbols-outlined">person</span>
        )}
      </div>
      <button className="flex-1 h-10 rounded-full bg-[#f0f2f5] hover:bg-[#e4e6eb] text-left px-4 text-[#65676b]">
        What's on your mind?
      </button>
    </div>
    <div className="border-t border-[#dddfe2] mt-4 pt-2 grid grid-cols-3 gap-2">
      <ComposerAction icon="videocam" label="Live" color="text-red-500" />
      <ComposerAction icon="photo_library" label="Photo" color="text-green-600" />
      <ComposerAction icon="mood" label="Feeling" color="text-yellow-500" />
    </div>
  </div>
);

const ComposerAction = ({ icon, label, color }) => (
  <button className="h-10 rounded-lg hover:bg-[#f0f2f5] flex items-center justify-center gap-2 font-semibold text-sm text-[#65676b]">
    <span className={`material-symbols-outlined text-[22px] ${color}`}>{icon}</span>
    {label}
  </button>
);

export default ProfilePage;

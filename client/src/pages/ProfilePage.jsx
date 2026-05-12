import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUserProfile } from '../redux/userSlice';
import TopAppBar from '../components/layout/TopAppBar';
import ProfileHeader from '../components/profile/ProfileHeader';
import FriendsGrid from '../components/profile/FriendsGrid';
import AboutCard from '../components/profile/AboutCard';
import RecentActivityCard from '../components/profile/RecentActivityCard';
import FAB from '../components/common/FAB';

const ProfilePage = () => {
  const dispatch = useDispatch();
  const { profile, loading, error } = useSelector((state) => state.user);

  useEffect(() => {
    dispatch(fetchUserProfile());
  }, [dispatch]);

  // Data derived from profile or empty defaults
  const displayProfile = {
    name: profile?.fullName || '',
    username: profile?.email ? `@${profile.email.split('@')[0]}` : '',
    bio: profile?.bio || '',
    coverImage: profile?.coverImage || null,
    profileImage: profile?.avatar || null,
    stats: {
      friends: profile?.friendsCount || 0,
      posts: 0,
      photos: 0
    },
    isOnline: profile?.isOnline || false
  };

  const friendsData = []; // No static friends

  const aboutData = [
    { icon: 'call', title: 'Phone Number', value: profile?.phone || '' },
    { icon: 'person', title: 'Gender', value: profile?.gender || '' },
    { icon: 'cake', title: 'Birthday', value: profile?.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : '' },
    { icon: 'location_on', title: 'Lives in', value: profile?.address || '' },
    { icon: 'history', title: 'Member since', value: profile?.createdAt ? `Joined ${new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}` : '' }
  ];

  const activities = []; // No static activities


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="bg-surface-container-low text-on-surface min-h-screen">
      <TopAppBar />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {error && (
          <div className="mb-6 bg-error-container text-on-error-container p-4 rounded-xl flex items-center gap-3">
            <span className="material-symbols-outlined">error</span>
            <span>{typeof error === 'string' ? error : error.message || 'Error loading profile'}</span>
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left/Main Column */}
          <div className="lg:col-span-8 space-y-8">
            <ProfileHeader profileData={displayProfile} />
            <FriendsGrid friends={friendsData} totalFriends={displayProfile.stats.friends} />
          </div>


          {/* Right Sidebar */}
          <div className="lg:col-span-4 space-y-8">
            <AboutCard aboutData={aboutData} />
            <RecentActivityCard activities={activities} />
            
            {/* Quick Links Footer */}
            <div className="px-2">
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-on-surface-variant text-xs opacity-70">
                <a className="hover:underline hover:text-primary transition-colors" href="#">Privacy</a>
                <a className="hover:underline hover:text-primary transition-colors" href="#">Terms</a>
                <a className="hover:underline hover:text-primary transition-colors" href="#">Cookies</a>
                <a className="hover:underline hover:text-primary transition-colors" href="#">More</a>
                <span>ZaloUTE © 2024</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <FAB icon="add" label="Post Update" />
    </div>
  );
};

export default ProfilePage;


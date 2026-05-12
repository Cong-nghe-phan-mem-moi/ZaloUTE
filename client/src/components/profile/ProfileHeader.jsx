import React from 'react';
import StatCard from '../common/StatCard';

const ProfileHeader = ({ profileData, onEdit }) => {

  const { name, username, bio, coverImage, profileImage, stats, isOnline } = profileData;

  return (
    <div className="bg-surface-container-lowest rounded-2xl shadow-premium overflow-hidden transition-all duration-500 border border-outline-variant/30">
      {/* Cover Image */}
      <CoverImage coverImage={coverImage} />

      {/* Profile Info */}
      <div className="px-8 pb-8">
        <div className="relative -mt-20 mb-6 flex items-end justify-between flex-wrap gap-4">
          <div className="flex items-end gap-6 flex-wrap">
            <ProfileAvatar profileImage={profileImage} isOnline={isOnline} />
            <div className="mb-4">
              <h1 className="font-headline-lg text-3xl text-on-surface tracking-tight">{name}</h1>
              <p className="text-on-surface-variant font-body-md flex items-center gap-2">
                <span className="font-medium">{username}</span>
                <span className="w-1 h-1 bg-outline-variant rounded-full"></span>
                <span className={isOnline ? 'text-green-600' : 'text-on-surface-variant/60'}>
                  {isOnline ? 'Active now' : 'Offline'}
                </span>
              </p>
            </div>
          </div>
          <ActionButtons onEdit={onEdit} />

        </div>

        {/* Bio */}
        <p className="text-on-surface font-body-lg max-w-2xl mb-8 leading-relaxed opacity-90">{bio}</p>

        {/* Stats */}
        <StatsSection stats={stats} />
      </div>
    </div>
  );
};


const CoverImage = ({ coverImage }) => (
  <div className="relative h-64 w-full bg-surface-variant">
    {coverImage && (
      <img
        className="w-full h-full object-cover"
        src={coverImage}
        alt="Profile cover"
      />
    )}

    <button className="absolute bottom-4 right-4 bg-black/50 hover:bg-black/60 text-white rounded-lg px-4 py-2 flex items-center gap-2 transition-colors">
      <span className="material-symbols-outlined text-sm">photo_camera</span>
      <span className="text-label-md font-label-md">Edit Cover</span>
    </button>
  </div>
);

const ProfileAvatar = ({ profileImage, isOnline }) => (
  <div className="relative group">
    <div className="w-40 h-40 rounded-full border-4 border-surface-container-lowest overflow-hidden bg-surface-dim shadow-premium transition-transform duration-300 group-hover:scale-[1.02]">
    {profileImage ? (
      <img className="w-full h-full object-cover" src={profileImage} alt="Profile" />
    ) : (
      <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary">
        <span className="material-symbols-outlined text-4xl">person</span>
      </div>
    )}

    </div>
    {isOnline && (
      <div className="absolute bottom-4 right-4 w-6 h-6 bg-green-500 border-4 border-surface-container-lowest rounded-full shadow-sm"></div>
    )}
  </div>
);


const ActionButtons = ({ onEdit }) => (

  <div className="flex gap-2 mb-2">
    <button 
      onClick={onEdit}
      className="bg-primary hover:bg-on-primary-fixed-variant text-on-primary rounded-lg px-6 py-2 font-label-md text-label-md transition-colors flex items-center gap-2"
    >
      <span className="material-symbols-outlined text-sm">edit</span>
      Edit Profile
    </button>

    <button className="bg-secondary-container hover:bg-outline-variant text-on-surface rounded-lg px-4 py-2 transition-colors">
      <span className="material-symbols-outlined">share</span>
    </button>
  </div>
);

const StatsSection = ({ stats }) => (
  <div className="flex gap-8 border-t border-outline-variant pt-6">
    <StatCard value={stats.friends} label="Friends" />
    <StatCard value={stats.posts} label="Posts" />
    <StatCard value={stats.photos} label="Photos" />
  </div>
);

export default ProfileHeader;

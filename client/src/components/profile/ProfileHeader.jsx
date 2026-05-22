import StatCard from '../common/StatCard';

const relationLabels = {
  friend: { icon: 'check_circle', label: 'Friends', disabled: true },
  sent_request: { icon: 'schedule', label: 'Request sent', disabled: true },
  received_request: { icon: 'check', label: 'Confirm', disabled: false },
  none: { icon: 'person_add', label: 'Add friend', disabled: false },
};

const ProfileHeader = ({
  profileData,
  onEdit,
  isOwnProfile = true,
  onSendFriendRequest,
  sendingFriendRequest = false,
  onAcceptFriendRequest,
  acceptingFriendRequest = false,
}) => {

  const { name, username, bio, coverImage, profileImage, stats, isOnline, relation } = profileData;

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden transition-all duration-500 border border-[#dddfe2]">
      {/* Cover Image */}
      <CoverImage coverImage={coverImage} isOwnProfile={isOwnProfile} />

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
          <ActionButtons
            isOwnProfile={isOwnProfile}
            onEdit={onEdit}
            relation={relation}
            onSendFriendRequest={onSendFriendRequest}
            sendingFriendRequest={sendingFriendRequest}
            onAcceptFriendRequest={onAcceptFriendRequest}
            acceptingFriendRequest={acceptingFriendRequest}
          />

        </div>

        {/* Bio */}
        <p className="text-on-surface font-body-lg max-w-2xl mb-8 leading-relaxed opacity-90">{bio}</p>

        {/* Stats */}
        <StatsSection stats={stats} />
      </div>
    </div>
  );
};


const CoverImage = ({ coverImage, isOwnProfile }) => (
  <div className="relative h-64 w-full bg-gradient-to-b from-[#d8dadf] to-[#f0f2f5]">
    {coverImage && (
      <img
        className="w-full h-full object-cover"
        src={coverImage}
        alt="Profile cover"
      />
    )}

    {isOwnProfile ? (
      <button className="absolute bottom-4 right-4 bg-white hover:bg-[#f0f2f5] text-[#050505] rounded-md px-4 py-2 flex items-center gap-2 transition-colors font-semibold text-sm shadow-sm">
        <span className="material-symbols-outlined text-[18px]">photo_camera</span>
        <span>Edit cover photo</span>
      </button>
    ) : null}
  </div>
);

const ProfileAvatar = ({ profileImage, isOnline }) => (
  <div className="relative group">
    <div className="w-40 h-40 rounded-full border-4 border-white overflow-hidden bg-[#e4e6eb] shadow-premium transition-transform duration-300 group-hover:scale-[1.02]">
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


const ActionButtons = ({
  isOwnProfile,
  onEdit,
  relation,
  onSendFriendRequest,
  sendingFriendRequest,
  onAcceptFriendRequest,
  acceptingFriendRequest,
}) => {
  if (!isOwnProfile) {
    const action = relationLabels[relation] || relationLabels.none;
    const isAcceptAction = relation === 'received_request';
    const isBusy = isAcceptAction ? acceptingFriendRequest : sendingFriendRequest;
    const handlePrimaryAction = isAcceptAction ? onAcceptFriendRequest : onSendFriendRequest;

    return (
      <div className="flex gap-2 mb-2">
        <button
          type="button"
          onClick={handlePrimaryAction}
          disabled={action.disabled || isBusy}
          className="bg-[#1877f2] hover:bg-[#166fe5] text-white rounded-md px-5 py-2 font-semibold text-sm transition-colors flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">
            {isBusy ? 'sync' : action.icon}
          </span>
          {isBusy ? (isAcceptAction ? 'Confirming...' : 'Sending...') : action.label}
        </button>

        <button className="bg-[#e4e6eb] hover:bg-[#d8dadf] text-[#050505] rounded-md px-5 py-2 transition-colors font-semibold text-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">chat</span>
          Message
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-2 mb-2">
      <button
        onClick={onEdit}
        className="bg-[#1877f2] hover:bg-[#166fe5] text-white rounded-md px-5 py-2 font-semibold text-sm transition-colors flex items-center gap-2"
      >
        <span className="material-symbols-outlined text-[18px]">edit</span>
        Edit profile
      </button>

      <button className="bg-[#e4e6eb] hover:bg-[#d8dadf] text-[#050505] rounded-md px-4 py-2 transition-colors">
        <span className="material-symbols-outlined">share</span>
      </button>
    </div>
  );
};

const StatsSection = ({ stats }) => (
  <div className="flex gap-8 border-t border-outline-variant pt-6">
    <StatCard value={stats.friends} label="Friends" />
    <StatCard value={stats.posts} label="Posts" />
    <StatCard value={stats.photos} label="Photos" />
  </div>
);

export default ProfileHeader;

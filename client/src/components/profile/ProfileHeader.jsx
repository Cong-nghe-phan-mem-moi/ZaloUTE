import StatCard from "../common/StatCard";

const relationLabels = {
  friend: { icon: "person_remove", label: "Unfriend", disabled: false },
  sent_request: { icon: "schedule", label: "Cancel request", disabled: false },
  received_request: { icon: "check", label: "Accept", disabled: false },
  none: { icon: "person_add", label: "Add friend", disabled: false },
};

const ProfileHeader = ({
  profileData,
  onEdit,
  isOwnProfile = true,
  onSendFriendRequest,
  onUploadAvatar,
  avatarUploading = false,
  onUploadCoverImage,
  coverUploading = false,
  sendingFriendRequest = false,
  onAcceptFriendRequest,
  acceptingFriendRequest = false,
  onRejectFriendRequest,
  rejectingFriendRequest = false,
  onCancelFriendRequest,
  cancellingFriendRequest = false,
  onUnfriend,
  unfriending = false,
  onPreviewAvatar,
  onPreviewCover,
  onBlockUser,
  onUnblockUser,
  blockingUser = false,
  unblockingUser = false,
  isBlocked = false,
  isFollowing = false,
  onToggleFollow,
  followLoading = false,
  onReportUser,
}) => {
  const {
    name,
    username,
    bio,
    coverImage,
    profileImage,
    stats,
    isOnline,
    relation,
  } = profileData;

  return (
    <div className="overflow-hidden rounded bg-white shadow-sm">
      <CoverImage
        coverImage={coverImage}
        isOwnProfile={isOwnProfile}
        onUploadCoverImage={onUploadCoverImage}
        coverUploading={coverUploading}
        onPreviewCover={onPreviewCover}
      />

      <div className="px-5 pb-7 sm:px-8">
        <div className="relative -mt-16 mb-6 flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-wrap items-end gap-5">
            <ProfileAvatar
              profileImage={profileImage}
              isOnline={isOnline}
              isOwnProfile={isOwnProfile}
              onUploadAvatar={onUploadAvatar}
              avatarUploading={avatarUploading}
              onPreviewAvatar={onPreviewAvatar}
            />
            <div className="mb-3 min-w-0">
              <h1 className="truncate text-3xl font-bold text-[#111827]">
                {name}
              </h1>
              <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-[#6b7280]">
                <span className="font-medium">{username}</span>
                <span className="h-1 w-1 rounded-full bg-[#d1d5db]" />
                <span
                  className={
                    isOnline ? "text-emerald-600" : "text-[#9ca3af]"
                  }
                >
                  {isOnline ? "Active now" : "Offline"}
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
            onRejectFriendRequest={onRejectFriendRequest}
            rejectingFriendRequest={rejectingFriendRequest}
            onCancelFriendRequest={onCancelFriendRequest}
            cancellingFriendRequest={cancellingFriendRequest}
            onUnfriend={onUnfriend}
            unfriending={unfriending}
            onBlockUser={onBlockUser}
            onUnblockUser={onUnblockUser}
            blockingUser={blockingUser}
            unblockingUser={unblockingUser}
            isBlocked={isBlocked}
            isFollowing={isFollowing}
            onToggleFollow={onToggleFollow}
            followLoading={followLoading}
            onReportUser={onReportUser}
          />
        </div>

        {bio ? (
          <p className="mb-7 max-w-2xl text-sm leading-6 text-[#4b5563]">
            {bio}
          </p>
        ) : null}

        <StatsSection stats={stats} />
      </div>
    </div>
  );
};

const CoverImage = ({
  coverImage,
  isOwnProfile,
  onUploadCoverImage,
  coverUploading,
  onPreviewCover,
}) => {
  return (
    <div className="relative h-56 w-full cursor-pointer bg-gradient-to-br from-[#dbeafe] via-[#bfdbfe] to-[#93c5fd] sm:h-60" onClick={onPreviewCover}>
      {coverImage && (
        <img
          className="h-full w-full object-cover"
          src={coverImage}
          alt="Profile cover"
        />
      )}

      {isOwnProfile ? (
        <label className="absolute bottom-4 right-4 z-30 flex cursor-pointer items-center gap-2 overflow-hidden rounded-md bg-white px-4 py-2 text-sm font-semibold text-[#111827] shadow-sm hover:bg-[#f2f3f5] has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60">
          <input
            type="file"
            accept="image/*"
            className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-not-allowed"
            disabled={coverUploading}
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              onUploadCoverImage?.(file);
            }}
          />
          <span className="material-symbols-outlined text-[18px]">
            {coverUploading ? "sync" : "photo_camera"}
          </span>
          <span>{coverUploading ? "Uploading..." : "Edit cover photo"}</span>
        </label>
      ) : null}
    </div>
  );
};

const ProfileAvatar = ({
  profileImage,
  isOnline,
  isOwnProfile,
  onUploadAvatar,
  avatarUploading,
  onPreviewAvatar,
}) => {
  return (
    <div className="relative group">
      <div onClick={onPreviewAvatar} className="h-32 w-32 cursor-pointer overflow-hidden rounded-full border-4 border-white bg-[#facc15] text-[#7c2d12] shadow-md transition-transform duration-300 group-hover:scale-[1.02] sm:h-36 sm:w-36">
        {profileImage ? (
          <img
            className="h-full w-full object-cover"
            src={profileImage}
            alt="Profile"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="material-symbols-outlined text-4xl">person</span>
          </div>
        )}
      </div>
      {isOnline && (
        <div className="absolute bottom-3 right-3 h-6 w-6 rounded-full border-4 border-white bg-emerald-500 shadow-sm" />
      )}
      {isOwnProfile ? (
        <label className="absolute bottom-2 left-1/2 z-30 flex h-9 w-9 -translate-x-1/2 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-white bg-[#1877f2] text-white shadow-sm transition-colors hover:bg-[#166fe5] has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60">
          <input
            type="file"
            accept="image/*"
            className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-not-allowed"
            disabled={avatarUploading}
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              onUploadAvatar?.(file);
            }}
          />
          <span className="material-symbols-outlined text-[19px]">
            {avatarUploading ? "sync" : "photo_camera"}
          </span>
        </label>
      ) : null}
    </div>
  );
};

const ActionButtons = ({
  isOwnProfile,
  onEdit,
  relation,
  onSendFriendRequest,
  sendingFriendRequest,
  onAcceptFriendRequest,
  acceptingFriendRequest,
  onRejectFriendRequest,
  rejectingFriendRequest,
  onCancelFriendRequest,
  cancellingFriendRequest,
  onUnfriend,
  unfriending,
  onBlockUser,
  onUnblockUser,
  blockingUser,
  unblockingUser,
  isBlocked,
  isFollowing,
  onToggleFollow,
  followLoading,
  onReportUser,
}) => {
  if (!isOwnProfile) {
    const action = relationLabels[relation] || relationLabels.none;
    const isAcceptAction = relation === "received_request";
    const isCancelAction = relation === "sent_request";
    const isUnfriendAction = relation === "friend";
    const isBusy = isAcceptAction
      ? acceptingFriendRequest
      : isCancelAction
        ? cancellingFriendRequest
        : isUnfriendAction
          ? unfriending
          : sendingFriendRequest;
    const handlePrimaryAction = isAcceptAction
      ? onAcceptFriendRequest
      : isCancelAction
        ? onCancelFriendRequest
        : isUnfriendAction
          ? onUnfriend
          : onSendFriendRequest;
    const handleSecondaryAction = isAcceptAction ? onRejectFriendRequest : null;

    return (
      <div className="mb-2 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handlePrimaryAction}
          disabled={action.disabled || isBusy}
          className={`flex items-center gap-2 rounded-md px-5 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
            isUnfriendAction
              ? "bg-[#dc3545] hover:bg-[#c82333] text-white"
              : "bg-[#1877f2] hover:bg-[#166fe5] text-white"
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">
            {isBusy ? "sync" : action.icon}
          </span>
          {isBusy
            ? isAcceptAction
              ? "Accepting..."
              : isCancelAction
                ? "Cancelling..."
                : isUnfriendAction
                  ? "Removing..."
                  : "Sending..."
            : action.label}
        </button>

        {isAcceptAction ? (
          <button
            type="button"
            onClick={handleSecondaryAction}
            disabled={rejectingFriendRequest}
            className="flex items-center gap-2 rounded-md bg-[#e5e7eb] px-5 py-2 text-sm font-semibold text-[#111827] transition-colors hover:bg-[#d1d5db] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-[18px]">
              {rejectingFriendRequest ? "sync" : "close"}
            </span>
            {rejectingFriendRequest ? "Rejecting..." : "Reject"}
          </button>
        ) : null}

        <button
          type="button"
          onClick={onToggleFollow}
          disabled={followLoading}
          className={`flex items-center gap-2 rounded-md px-5 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
            isFollowing
              ? "bg-[#e7f3ff] text-[#1877f2] hover:bg-[#dbeafe]"
              : "bg-[#e5e7eb] text-[#111827] hover:bg-[#d1d5db]"
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">
            {followLoading ? "sync" : isFollowing ? "done" : "rss_feed"}
          </span>
          {followLoading ? "Saving..." : isFollowing ? "Following" : "Follow"}
        </button>

        <button
          type="button"
          onClick={isBlocked ? onUnblockUser : onBlockUser}
          disabled={blockingUser || unblockingUser}
          className="flex items-center gap-2 rounded-md bg-[#111827] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="material-symbols-outlined text-[18px]">
            {blockingUser || unblockingUser ? "sync" : "block"}
          </span>
          {blockingUser || unblockingUser
            ? isBlocked
              ? "Unblocking..."
              : "Blocking..."
            : isBlocked
              ? "Unblock"
              : "Block"}
        </button>

        <button
          type="button"
          onClick={onReportUser}
          className="flex items-center gap-2 rounded-md bg-[#fee2e2] px-5 py-2 text-sm font-semibold text-[#b91c1c] transition-colors hover:bg-[#fecaca]"
        >
          <span className="material-symbols-outlined text-[18px]">flag</span>
          Report
        </button>

        <button className="flex items-center gap-2 rounded-md bg-[#e5e7eb] px-5 py-2 text-sm font-semibold text-[#111827] transition-colors hover:bg-[#d1d5db]">
          <span className="material-symbols-outlined text-[18px]">chat</span>
          Message
        </button>
      </div>
    );
  }

  return (
    <div className="mb-2 flex gap-2">
      <button
        onClick={onEdit}
        className="flex items-center gap-2 rounded-md bg-[#1877f2] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#166fe5]"
      >
        <span className="material-symbols-outlined text-[18px]">edit</span>
        Edit profile
      </button>

      <button className="rounded-md bg-[#e5e7eb] px-4 py-2 text-[#111827] transition-colors hover:bg-[#d1d5db]">
        <span className="material-symbols-outlined">share</span>
      </button>
    </div>
  );
};

const StatsSection = ({ stats }) => (
  <div className="flex gap-8 border-t border-[#e5e7eb] pt-6">
    <StatCard value={stats.friends} label="Friends" />
    <StatCard value={stats.posts} label="Posts" />
    <StatCard value={stats.photos} label="Photos" />
  </div>
);

export default ProfileHeader;

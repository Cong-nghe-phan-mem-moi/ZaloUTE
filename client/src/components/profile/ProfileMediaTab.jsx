import UserMediaGallery from "../media/UserMediaGallery";

const getProfileId = (profile) => profile?.userId || profile?._id || profile?.id;

export default function ProfileMediaTab({ profile, isOwnProfile = false }) {
  return (
    <UserMediaGallery
      userId={getProfileId(profile)}
      isOwnProfile={isOwnProfile}
    />
  );
}

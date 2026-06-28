import { useEffect } from "react";
import { useParams } from "react-router-dom";
import HomeHeader from "../../components/home/HomeHeader";
import UserMediaGallery from "../../components/media/UserMediaGallery";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { fetchUserProfile } from "../../redux/slices/userSlice";

const getProfileId = (profile) => profile?.userId || profile?._id || profile?.id;

const UserMediaPage = ({ own = false }) => {
  const { userId } = useParams();
  const dispatch = useAppDispatch();
  const { profile } = useAppSelector((state) => state.user);
  const currentUserId = getProfileId(profile);
  const targetUserId = own ? currentUserId : userId;

  useEffect(() => {
    dispatch(fetchUserProfile());
  }, [dispatch]);

  return (
    <div className="min-h-screen bg-[#f2f3f5] text-[#111827]">
      <HomeHeader profile={profile} activePage={null} />
      <main className="mx-auto w-full max-w-6xl px-3 py-3 sm:px-4 sm:py-5">
        <UserMediaGallery
          userId={targetUserId}
          isOwnProfile={own || String(targetUserId) === String(currentUserId)}
        />
      </main>
    </div>
  );
};

export default UserMediaPage;

import { useEffect } from "react";
import { useParams } from "react-router-dom";
import HomeHeader from "../../components/home/HomeHeader";
import LeftSidebar from "../../components/home/LeftSidebar";
import RightSidebar from "../../components/home/RightSidebar";
import UserMediaGallery from "../../components/media/UserMediaGallery";
import { useHomeSidebar } from "../../hooks";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { fetchUserProfile } from "../../redux/slices/userSlice";

const getProfileId = (profile) => profile?.userId || profile?._id || profile?.id;

const UserMediaPage = ({ own = false }) => {
  const { userId } = useParams();
  const dispatch = useAppDispatch();
  const { profile } = useAppSelector((state) => state.user);
  const {
    contacts,
    friendRequests,
    groupConversations,
    groupsLoading,
    handleAcceptRequest,
    handleContactClick,
    handleGroupClick,
    handleRejectRequest,
    requestActionId,
    requestsLoading,
  } = useHomeSidebar({ dispatch, profile });
  const currentUserId = getProfileId(profile);
  const targetUserId = own ? currentUserId : userId;

  useEffect(() => {
    dispatch(fetchUserProfile());
  }, [dispatch]);

  return (
    <div className="min-h-screen bg-[#f2f3f5] text-[#111827]">
      <HomeHeader profile={profile} activePage={null} />
      <main className="grid min-h-[calc(100vh-80px)] grid-cols-1 justify-center bg-[#f2f3f5] lg:grid-cols-[240px_minmax(0,680px)] xl:grid-cols-[260px_minmax(0,680px)_300px] 2xl:grid-cols-[280px_minmax(0,760px)_320px]">
        <LeftSidebar profile={profile} />

        <section className="min-w-0 space-y-4 px-3 py-3 sm:px-4 sm:py-4 lg:space-y-5 lg:px-5 lg:py-5">
          <UserMediaGallery
            userId={targetUserId}
            isOwnProfile={own || String(targetUserId) === String(currentUserId)}
          />
        </section>

        <RightSidebar
          contacts={contacts}
          friendRequests={friendRequests}
          groupConversations={groupConversations}
          groupsLoading={groupsLoading}
          requestsLoading={requestsLoading}
          requestActionId={requestActionId}
          onAcceptRequest={handleAcceptRequest}
          onRejectRequest={handleRejectRequest}
          onContactClick={handleContactClick}
          onGroupClick={handleGroupClick}
        />
      </main>
    </div>
  );
};

export default UserMediaPage;

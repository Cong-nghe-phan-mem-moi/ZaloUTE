import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { StatusCard, UserAvatar } from "../../components/common";
import HomeHeader from "../../components/home/HomeHeader";
import LeftSidebar from "../../components/home/LeftSidebar";
import RightSidebar from "../../components/home/RightSidebar";
import { fallbackContacts } from "../../components/home/homeData";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { fetchUserProfile } from "../../redux/slices/userSlice";

const getFriendId = (friend) =>
  friend?.id || friend?._id || friend?.userId || friend;

const Friends = () => {
  const dispatch = useAppDispatch();
  const { profile, loading, error } = useAppSelector((state) => state.user);

  useEffect(() => {
    dispatch(fetchUserProfile());
  }, [dispatch]);

  const friends = useMemo(() => {
    if (!Array.isArray(profile?.friends)) {
      return [];
    }

    return profile.friends
      .map((friend) => ({
        id: getFriendId(friend),
        name: friend?.fullName || friend?.name || "Friend",
        avatar: friend?.avatar || friend?.image || null,
        isOnline: friend?.isOnline || false,
        lastActive: friend?.lastActive || null,
      }))
      .filter((friend) => friend.id);
  }, [profile]);

  const contacts = useMemo(() => {
    if (!Array.isArray(profile?.friends) || profile.friends.length === 0) {
      return fallbackContacts;
    }

    return profile.friends.map((friend) => ({
      name: friend?.fullName || friend?.name || "Friend",
      avatar: friend?.avatar || friend?.image || null,
      status: friend?.isOnline ? "Online" : "View profile",
      online: friend?.isOnline || false,
    }));
  }, [profile]);

  return (
    <div className="min-h-screen bg-[#f2f3f5] text-[#111827]">
      <div className="min-h-screen w-full bg-white">
        <HomeHeader profile={profile} activePage="friends" />

        <main className="grid min-h-[calc(100vh-80px)] grid-cols-1 justify-center bg-[#f2f3f5] lg:grid-cols-[240px_minmax(0,680px)] xl:grid-cols-[260px_minmax(0,680px)_300px] 2xl:grid-cols-[280px_minmax(0,760px)_320px]">
          <LeftSidebar profile={profile} />

          <section className="min-w-0 space-y-4 px-3 py-3 sm:px-4 sm:py-4 lg:space-y-5 lg:px-5 lg:py-5">
            <section className="rounded bg-white p-7 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase text-[#1877f2]">
                    Your network
                  </p>
                  <h1 className="mt-1 text-2xl font-bold">Friends</h1>
                  <p className="mt-1 text-sm text-[#6b7280]">
                    {friends.length} friends total
                  </p>
                </div>
                <Link
                  to="/friend-requests"
                  className="rounded-md bg-[#1877f2] px-5 py-2 text-sm font-semibold text-white shadow-md hover:bg-[#166fe5]"
                >
                  Friend requests
                </Link>
              </div>
            </section>

            {error ? (
              <StatusCard
                icon="error"
                tone="error"
                message={
                  typeof error === "string" ? error : "Unable to load friends."
                }
              />
            ) : null}

            {loading && !profile ? (
              <StatusCard icon="sync" message="Loading friends..." loading />
            ) : null}

            {!loading && !error && friends.length === 0 ? (
              <StatusCard
                icon="group"
                message="No friends to show yet."
                detail="Friend requests you accept will appear here."
              />
            ) : null}

            {friends.length > 0 ? (
              <section className="rounded bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-base font-bold">All friends</h2>
                  <span className="text-xs font-semibold text-[#6b7280]">
                    {friends.length} people
                  </span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {friends.map((friend) => (
                    <FriendCard key={friend.id} friend={friend} />
                  ))}
                </div>
              </section>
            ) : null}
          </section>

          <RightSidebar contacts={contacts} profile={profile} />
        </main>
      </div>
    </div>
  );
};

const FriendCard = ({ friend }) => (
  <Link
    to={`/users/profile/${friend.id}`}
    className="flex items-center gap-4 rounded-md bg-white p-4 shadow-sm ring-1 ring-[#eef0f2] transition hover:-translate-y-0.5 hover:shadow-md"
  >
    <UserAvatar image={friend.avatar} name={friend.name} />
    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-bold">{friend.name}</p>
      <p className="mt-1 flex items-center gap-2 text-xs text-[#6b7280]">
        <span
          className={`h-2 w-2 rounded-full ${
            friend.isOnline ? "bg-emerald-500" : "bg-[#9ca3af]"
          }`}
        />
        {friend.isOnline ? "Online" : "View profile"}
      </p>
    </div>
    <span className="material-symbols-outlined text-[20px] text-[#6b7280]">
      chevron_right
    </span>
  </Link>
);

export default Friends;

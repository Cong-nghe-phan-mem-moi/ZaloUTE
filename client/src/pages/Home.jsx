import { useEffect, useMemo } from "react";
import Composer from "../components/home/Composer";
import HomeHeader from "../components/home/HomeHeader";
import LeftSidebar from "../components/home/LeftSidebar";
import RightSidebar from "../components/home/RightSidebar";
import Stories from "../components/home/Stories";
import { PostList } from "../components/Post";
import { fallbackContacts } from "../components/home/homeData";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchUserProfile } from "../store/slices/userSlice";

export default function Home() {
  const dispatch = useAppDispatch();
  const { profile } = useAppSelector((state) => state.user);

  useEffect(() => {
    dispatch(fetchUserProfile());
  }, [dispatch]);

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

  const friendIds = useMemo(() => {
    if (!Array.isArray(profile?.friends)) {
      return [];
    }

    return profile.friends
      .map((friend) => friend?.userId || friend?._id || friend?.id || friend)
      .filter(Boolean);
  }, [profile]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f49b5] via-[#1e63d6] to-[#3b82f6] px-4 py-6 text-[#111827]">
      <div className="mx-auto max-w-[1320px] overflow-hidden rounded-[28px] bg-white shadow-2xl">
        <HomeHeader profile={profile} />

        <main className="grid min-h-[760px] grid-cols-1 bg-[#f2f3f5] lg:grid-cols-[250px_minmax(0,1fr)_300px]">
          <LeftSidebar profile={profile} />

          <section className="space-y-5 px-5 py-5">
            <Stories />
            <Composer profile={profile} />
            <PostList
              allowedAuthorIds={friendIds}
              emptyMessage="No posts from friends yet"
              emptyDetail="The home feed only shows posts from your friends."
            />
          </section>

          <RightSidebar contacts={contacts} profile={profile} />
        </main>
      </div>
    </div>
  );
}

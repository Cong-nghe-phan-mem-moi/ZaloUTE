import { useMemo } from "react";

const getId = (item) => item?._id || item?.id || item?.userId || item || "";

export const useProfileFriends = (profile, fallbackName = "Friend") => {
  const friends = useMemo(() => {
    if (!Array.isArray(profile?.friends)) return [];

    return profile.friends
      .map((friend) => ({
        id: getId(friend),
        fullName: friend?.fullName || friend?.name || fallbackName,
        name: friend?.fullName || friend?.name || fallbackName,
        avatar: friend?.avatar || friend?.image || null,
        isOnline: friend?.isOnline || false,
      }))
      .filter((friend) => friend.id);
  }, [fallbackName, profile]);

  const contacts = useMemo(
    () =>
      friends.map((friend) => ({
        id: friend.id,
        name: friend.name,
        avatar: friend.avatar,
        status: friend.isOnline ? "Online" : "View profile",
        online: friend.isOnline,
      })),
    [friends],
  );

  return { friends, contacts };
};

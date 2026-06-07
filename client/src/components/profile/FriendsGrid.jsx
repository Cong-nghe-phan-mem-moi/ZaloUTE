import FriendCard from '../common/FriendCard';

const FriendsGrid = ({ friends, totalFriends }) => {
  return (
    <div className="rounded bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-[#111827]">Friends</h2>
          <p className="text-sm text-[#6b7280]">
            {totalFriends} friends total
          </p>
        </div>
        <a
          href="/friends"
          className="text-xs font-semibold text-[#1877f2] hover:underline"
        >
          See all friends
        </a>
      </div>
      
      {friends.length > 0 ? (
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-4">
          {friends.map((friend) => (
            <FriendCard key={friend.id} friend={friend} />
          ))}
          {totalFriends > friends.length ? (
            <div className="group cursor-pointer space-y-2">
              <div className="aspect-square overflow-hidden rounded-md bg-[#f2f3f5]">
                <div className="flex h-full w-full items-center justify-center text-lg font-bold text-[#6b7280]">
                  +{totalFriends - friends.length}
                </div>
              </div>
              <p className="truncate text-xs font-semibold text-[#111827]">
                More
              </p>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="rounded-md bg-[#f2f3f5] p-4 text-sm text-[#6b7280]">
          No public friends to show.
        </div>
      )}
    </div>
  );
};

export default FriendsGrid;

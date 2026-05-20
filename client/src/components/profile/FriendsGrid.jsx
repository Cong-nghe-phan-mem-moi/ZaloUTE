import FriendCard from '../common/FriendCard';

const FriendsGrid = ({ friends, totalFriends }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-[#dddfe2]">

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-headline-md text-headline-md text-[#050505]">Friends</h2>
          <p className="text-[#65676b] font-body-md text-body-md">{totalFriends} friends total</p>
        </div>
        <button className="text-[#1877f2] font-label-md text-label-md hover:underline">See all friends</button>
      </div>
      
      {friends.length > 0 ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
          {friends.map((friend) => (
            <FriendCard key={friend.id} friend={friend} />
          ))}
          {totalFriends > friends.length ? (
            <div className="space-y-2 group cursor-pointer">
              <div className="aspect-square rounded-lg overflow-hidden bg-[#f0f2f5]">
                <div className="w-full h-full flex items-center justify-center text-[#65676b] font-bold text-headline-md">
                  +{totalFriends - friends.length}
                </div>
              </div>
              <p className="font-label-md text-label-md text-[#050505] truncate">More</p>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="rounded-lg bg-[#f0f2f5] p-4 text-sm text-[#65676b]">
          No public friends to show.
        </div>
      )}
    </div>
  );
};

export default FriendsGrid;

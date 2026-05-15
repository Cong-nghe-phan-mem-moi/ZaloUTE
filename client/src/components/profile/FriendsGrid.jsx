import React from 'react';
import FriendCard from '../common/FriendCard';

const FriendsGrid = ({ friends, totalFriends }) => {
  return (
    <div className="bg-surface-container-lowest rounded-2xl shadow-premium p-8 border border-outline-variant/30">

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-headline-md text-headline-md text-on-surface">Friends</h2>
          <p className="text-on-surface-variant font-body-md text-body-md">{totalFriends} friends total</p>
        </div>
        <button className="text-primary font-label-md text-label-md hover:underline">See all friends</button>
      </div>
      
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
        {friends.map((friend) => (
          <FriendCard key={friend.id} friend={friend} />
        ))}
        {/* More Friends Card */}
        <div className="space-y-2 group cursor-pointer">
          <div className="aspect-square rounded-lg overflow-hidden bg-surface-variant">
            <div className="w-full h-full bg-secondary-container flex items-center justify-center text-on-surface-variant font-bold text-headline-md">
              +1.2k
            </div>
          </div>
          <p className="font-label-md text-label-md text-on-surface truncate">More</p>
        </div>
      </div>
    </div>
  );
};

export default FriendsGrid;

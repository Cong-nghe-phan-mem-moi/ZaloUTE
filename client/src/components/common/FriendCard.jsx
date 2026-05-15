import React from 'react';

const FriendCard = ({ friend }) => {
  return (
    <div className="space-y-2 group cursor-pointer">
      <div className="aspect-square rounded-lg overflow-hidden bg-surface-variant">
        <img
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          src={friend.image}
          alt={friend.name}
        />
      </div>
      <p className="font-label-md text-label-md text-on-surface truncate">{friend.name}</p>
    </div>
  );
};

export default FriendCard;

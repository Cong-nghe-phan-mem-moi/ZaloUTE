const FriendCard = ({ friend }) => {
  return (
    <div className="space-y-2 group cursor-pointer">
      <div className="aspect-square rounded-lg overflow-hidden bg-[#f0f2f5]">
        {friend.image ? (
          <img
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            src={friend.image}
            alt={friend.name}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#65676b]">
            <span className="material-symbols-outlined text-4xl">person</span>
          </div>
        )}
      </div>
      <p className="font-label-md text-label-md text-[#050505] truncate">{friend.name}</p>
    </div>
  );
};

export default FriendCard;

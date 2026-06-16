import { Link } from "react-router-dom";

const FriendCard = ({ friend }) => {
  return (
    <Link
      to={`/users/profile/${friend.id}`}
      className="group block cursor-pointer space-y-2"
    >
      <div className="aspect-square overflow-hidden rounded-md bg-[#f2f3f5] shadow-sm ring-1 ring-[#eef0f2]">
        {friend.image ? (
          <img
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            src={friend.image}
            alt={friend.name}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[#6b7280]">
            <span className="material-symbols-outlined text-4xl">person</span>
          </div>
        )}
      </div>
      <p className="truncate text-xs font-semibold text-[#111827]">
        {friend.name}
      </p>
    </Link>
  );
};

export default FriendCard;

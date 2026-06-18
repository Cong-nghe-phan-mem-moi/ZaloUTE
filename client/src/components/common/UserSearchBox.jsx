import { useCallback, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useClickOutside, useUserSearch } from "../../hooks";
import UserAvatar from "./UserAvatar";

const UserSearchBox = ({
  placeholder = "Search ...",
  wrapperClassName = "relative hidden md:block",
  shellClassName = "flex h-10 items-center gap-2 rounded-full bg-white text-[#6b7280]",
  inputClassName = "w-44 border-0 bg-transparent text-sm outline-none placeholder:text-[#9ca3af]",
  dropdownClassName = "absolute left-0 top-12 z-50 w-[min(360px,calc(100vw-24px))] rounded-lg border border-[#dddfe2] bg-white p-2 shadow-2xl",
  avatarSize = "sm",
  avatarVariant = "warm",
}) => {
  const [keyword, setKeyword] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef(null);
  const { error, hasQuery, loading, results } = useUserSearch(keyword);

  const closeSearch = useCallback(() => setIsOpen(false), []);
  useClickOutside(searchRef, closeSearch);

  const shouldShowDropdown = isOpen && hasQuery;

  return (
    <div className={wrapperClassName} ref={searchRef}>
      <div className={shellClassName}>
        <span className="material-symbols-outlined text-[20px]">search</span>
        <input
          className={inputClassName}
          placeholder={placeholder}
          type="text"
          value={keyword}
          onChange={(event) => {
            setKeyword(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
        />
      </div>

      {shouldShowDropdown ? (
        <div className={dropdownClassName}>
          <div className="px-2 py-2 text-sm font-semibold text-[#65676b]">
            Search results
          </div>

          {loading ? (
            <div className="flex items-center gap-3 px-2 py-3 text-[#65676b]">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#1877f2] border-t-transparent" />
              <span className="text-sm">Searching...</span>
            </div>
          ) : null}

          {!loading && error ? (
            <p className="px-2 py-3 text-sm text-red-600">{error}</p>
          ) : null}

          {!loading && !error && results.length === 0 ? (
            <p className="px-2 py-3 text-sm text-[#65676b]">
              No matching users found.
            </p>
          ) : null}

          {!loading && !error
            ? results.map((user) => (
                <SearchResultItem
                  key={user.id}
                  user={user}
                  avatarSize={avatarSize}
                  avatarVariant={avatarVariant}
                />
              ))
            : null}
        </div>
      ) : null}
    </div>
  );
};

const SearchResultItem = ({ user, avatarSize, avatarVariant }) => (
  <Link
    to={`/users/profile/${user.id}`}
    className="flex items-center gap-3 rounded-lg p-2 text-[#050505] hover:bg-[#f0f2f5]"
  >
    <UserAvatar
      image={user.avatar}
      name={user.fullName}
      size={avatarSize}
      variant={avatarVariant}
    />
    <div className="min-w-0">
      <p className="truncate text-[15px] font-semibold">{user.fullName}</p>
      <p className="text-xs text-[#65676b]">
        {user.relation === "friend"
          ? "Friend"
          : user.relation === "sent_request"
            ? "Request sent"
            : user.relation === "received_request"
              ? "Respond to request"
              : "View profile"}
      </p>
    </div>
  </Link>
);

export default UserSearchBox;


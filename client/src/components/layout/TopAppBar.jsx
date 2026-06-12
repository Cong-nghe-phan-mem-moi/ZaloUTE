import { useEffect, useRef, useState } from "react";
import { userAPI } from "../../services/api";
import { useAppDispatch } from "../../store/hooks";
import { clearProfile } from "../../store/slices/userSlice";

const getInitials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "U";

const TopAppBar = ({ profile }) => {
  const dispatch = useAppDispatch();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const pathname = window.location.pathname;
  const isHomePage = pathname === "/" || pathname === "/home";
  const isFriendRequestsPage = pathname === "/friend-requests";

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    try {
      await userAPI.logout();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      localStorage.removeItem("token");
      dispatch(clearProfile());
      window.location.assign("/login");
    }
  };

  return (
    <header className="sticky top-0 w-full z-50 bg-white border-b border-[#dddfe2] shadow-sm h-14">
      <div className="h-full px-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0 flex-1 md:flex-none">
          <a
            href="/"
            className="w-10 h-10 rounded-full bg-[#1877f2] text-white flex items-center justify-center text-2xl font-bold shrink-0"
            aria-label="ZaloUTE home"
          >
            z
          </a>
          <SearchBox />
        </div>

        <nav className="hidden md:flex items-center justify-center gap-2 absolute left-1/2 -translate-x-1/2">
          <NavIcon icon="home" label="Home" href="/" active={isHomePage} />
          <NavIcon
            icon="group"
            label="Friends"
            href="/friend-requests"
            active={isFriendRequestsPage}
          />
          <NavIcon icon="forum" label="Messages" href="/" />
          <NavIcon icon="smart_display" label="Watch" href="/" />
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          <CircleButton icon="apps" label="Menu" />
          <CircleButton icon="notifications" label="Notifications" />
          <CircleButton
            icon="logout"
            label={isLoggingOut ? "Logging out" : "Log out"}
            onClick={handleLogout}
            disabled={isLoggingOut}
          />
          <a
            href="/user/profile"
            className="hidden sm:flex items-center gap-2 rounded-full hover:bg-[#f0f2f5] p-1 pr-3 text-[#050505]"
          >
            <Avatar
              image={profile?.avatar}
              name={profile?.fullName}
              size="sm"
            />
            <span className="font-semibold text-sm max-w-28 truncate">
              {profile?.fullName?.split(" ")?.slice(-1)?.[0] || "Profile"}
            </span>
          </a>
        </div>
      </div>
    </header>
  );
};

const SearchBox = () => {
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const value = keyword.trim();

    if (value.length < 2) {
      return;
    }

    let isCurrent = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError("");

    const timer = window.setTimeout(async () => {
      try {
        const response = await userAPI.searchUsers(value, 1, 8);
        if (!isCurrent) return;
        setResults(response.data?.data || []);
      } catch (err) {
        if (!isCurrent) return;
        setResults([]);
        setError(
          err.response?.data?.message || "Unable to search users.",
        );
      } finally {
        if (isCurrent) {
          setLoading(false);
          setIsOpen(true);
        }
      }
    }, 300);

    return () => {
      isCurrent = false;
      window.clearTimeout(timer);
    };
  }, [keyword]);

  const shouldShowDropdown = isOpen && keyword.trim().length >= 2;

  return (
    <div className="relative w-full max-w-70" ref={searchRef}>
      <div className="h-10 bg-[#f0f2f5] rounded-full flex items-center gap-2 px-3 text-[#65676b]">
        <span className="material-symbols-outlined text-[20px]">search</span>
        <input
          className="bg-transparent border-0 outline-none text-[15px] text-[#050505] placeholder:text-[#65676b] w-full"
          placeholder="Search ZaloUTE"
          type="text"
          value={keyword}
          onChange={(event) => {
            const nextKeyword = event.target.value;
            setKeyword(nextKeyword);
            setIsOpen(true);

            if (nextKeyword.trim().length < 2) {
              setResults([]);
              setError("");
              setLoading(false);
            }
          }}
          onFocus={() => setIsOpen(true)}
        />
      </div>

      {shouldShowDropdown ? (
        <div className="absolute left-0 top-12 w-[min(360px,calc(100vw-24px))] bg-white rounded-lg shadow-2xl border border-[#dddfe2] p-2">
          <div className="px-2 py-2 text-sm font-semibold text-[#65676b]">
            Search results
          </div>

          {loading ? (
            <div className="flex items-center gap-3 px-2 py-3 text-[#65676b]">
              <span className="w-5 h-5 rounded-full border-2 border-[#1877f2] border-t-transparent animate-spin" />
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
                <SearchResultItem key={user.id} user={user} />
              ))
            : null}
        </div>
      ) : null}
    </div>
  );
};

const SearchResultItem = ({ user }) => (
  <a
    href={`/users/profile/${user.id}`}
    className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#f0f2f5] text-[#050505]"
  >
    <Avatar image={user.avatar} name={user.fullName} />
    <div className="min-w-0">
      <p className="font-semibold text-[15px] truncate">{user.fullName}</p>
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
  </a>
);

const NavIcon = ({ icon, label, href, active = false }) => (
  <a
    href={href}
    className={`h-12 w-24 rounded-lg flex items-center justify-center ${
      active
        ? "text-[#1877f2] border-b-4 border-[#1877f2]"
        : "text-[#65676b] hover:bg-[#f0f2f5]"
    }`}
    title={label}
    aria-label={label}
  >
    <span className="material-symbols-outlined text-[28px]">{icon}</span>
  </a>
);

const CircleButton = ({ icon, label, onClick, disabled = false }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="w-10 h-10 rounded-full bg-[#e4e6eb] hover:bg-[#d8dadf] flex items-center justify-center text-[#050505]"
    title={label}
    aria-label={label}
  >
    <span className="material-symbols-outlined text-[22px]">{icon}</span>
  </button>
);

const Avatar = ({ image, name, size = "md" }) => {
  const sizeClass = size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm";

  return (
    <div
      className={`${sizeClass} rounded-full overflow-hidden bg-[#dbe7ff] text-[#1877f2] flex items-center justify-center font-bold shrink-0`}
    >
      {image ? (
        <img
          className="w-full h-full object-cover"
          src={image}
          alt={name || "User"}
        />
      ) : (
        <span>{getInitials(name)}</span>
      )}
    </div>
  );
};

export default TopAppBar;

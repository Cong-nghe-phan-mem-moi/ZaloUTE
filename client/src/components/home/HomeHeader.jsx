import { useEffect, useRef, useState } from "react";
import { userAPI } from "../../services/api";
import { useAppDispatch } from "../../store/hooks";
import { clearProfile } from "../../store/slices/userSlice";
import HomeAvatar from "./HomeAvatar";

const HomeHeader = ({ profile, activePage = "home" }) => {
  const dispatch = useAppDispatch();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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
    <header className="flex h-20 items-center justify-between gap-4 bg-white px-6 lg:px-12">
      <div className="flex items-center gap-5">
        <a
          href="/home"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1877f2] text-xl font-bold text-white"
          aria-label="ZaloUTE home"
        >
          z
        </a>
        <SearchBox />
      </div>

      <nav className="hidden flex-1 items-center justify-center gap-8 text-[#6b7280] md:flex">
        <HeaderTab icon="home" active={activePage === "home"} />
        <HeaderTab icon="storefront" />
        <HeaderTab icon="smart_display" />
        <HeaderTab
          icon="groups"
          href="/friends"
          active={activePage === "friends"}
        />
      </nav>

      <div className="flex items-center gap-3">
        <CircleIcon icon="forum" label="Messages" />
        <CircleIcon icon="notifications" label="Notifications" />
        <CircleIcon
          icon="logout"
          label={isLoggingOut ? "Logging out" : "Log out"}
          onClick={handleLogout}
          disabled={isLoggingOut}
        />
        <HomeAvatar image={profile?.avatar} name={profile?.fullName} size="sm" />
        <a
          href="/user/profile"
          className="hidden text-sm font-semibold text-[#111827] sm:block"
        >
          {profile?.fullName || "Hexa Pentania"}
        </a>
        <span className="material-symbols-outlined text-[18px] text-[#111827]">
          expand_more
        </span>
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

    const timer = window.setTimeout(async () => {
      try {
        const response = await userAPI.searchUsers(value, 1, 8);
        if (!isCurrent) return;
        setResults(response.data?.data || []);
      } catch (err) {
        if (!isCurrent) return;
        setResults([]);
        setError(err.response?.data?.message || "Unable to search users.");
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
    <div className="relative hidden md:block" ref={searchRef}>
      <div className="flex h-10 items-center gap-2 rounded-full bg-white text-[#6b7280]">
        <span className="material-symbols-outlined text-[20px]">search</span>
        <input
          className="w-44 border-0 bg-transparent text-sm outline-none placeholder:text-[#9ca3af]"
          placeholder="Search ..."
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
            } else {
              setLoading(true);
              setError("");
            }
          }}
          onFocus={() => setIsOpen(true)}
        />
      </div>

      {shouldShowDropdown ? (
        <div className="absolute left-0 top-12 z-50 w-[min(360px,calc(100vw-24px))] rounded-lg border border-[#dddfe2] bg-white p-2 shadow-2xl">
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
            ? results.map((user) => <SearchResultItem key={user.id} user={user} />)
            : null}
        </div>
      ) : null}
    </div>
  );
};

const SearchResultItem = ({ user }) => (
  <a
    href={`/users/profile/${user.id}`}
    className="flex items-center gap-3 rounded-lg p-2 text-[#050505] hover:bg-[#f0f2f5]"
  >
    <HomeAvatar image={user.avatar} name={user.fullName} size="sm" />
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
  </a>
);

const HeaderTab = ({ icon, active = false, href = "/home" }) => (
  <a
    href={href}
    className={`flex h-14 w-20 items-center justify-center border-b-4 ${
      active
        ? "border-[#1877f2] text-[#1877f2]"
        : "border-transparent hover:text-[#1877f2]"
    }`}
  >
    <span className="material-symbols-outlined text-[24px]">{icon}</span>
  </a>
);

const CircleIcon = ({ icon, label, onClick, disabled = false }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={label}
    aria-label={label}
    className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f1f3f5] text-[#111827] hover:bg-[#e5e7eb] disabled:cursor-not-allowed disabled:opacity-60"
  >
    <span className="material-symbols-outlined text-[20px]">{icon}</span>
  </button>
);

export default HomeHeader;

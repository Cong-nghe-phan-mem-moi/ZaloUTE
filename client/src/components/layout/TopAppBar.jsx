import { NavLink, Link, useLocation } from "react-router-dom";
import { AppLogo, IconButton, UserAvatar, UserSearchBox } from "../common";
import { useLogout } from "../../hooks";

const TopAppBar = ({ profile }) => {
  const location = useLocation();
  const { isLoggingOut, logout: handleLogout } = useLogout();
  const pathname = location.pathname;
  const isHomePage = pathname === "/" || pathname === "/home";
  const isFriendRequestsPage = pathname === "/friend-requests";

  return (
    <header className="sticky top-0 z-50 h-14 w-full border-b border-[#dddfe2] bg-white shadow-sm">
      <div className="flex h-full items-center justify-between gap-3 px-4">
        <div className="flex min-w-0 flex-1 items-center gap-2 md:flex-none">
          <AppLogo className="shrink-0 text-2xl" />
          <UserSearchBox
            placeholder="Search ZaloUTE"
            wrapperClassName="relative w-full max-w-70"
            shellClassName="flex h-10 items-center gap-2 rounded-full bg-[#f0f2f5] px-3 text-[#65676b]"
            inputClassName="w-full border-0 bg-transparent text-[15px] text-[#050505] outline-none placeholder:text-[#65676b]"
            dropdownClassName="absolute left-0 top-12 z-50 w-[min(360px,calc(100vw-24px))] rounded-lg border border-[#dddfe2] bg-white p-2 shadow-2xl"
            avatarVariant="blue"
          />
        </div>

        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center justify-center gap-2 md:flex">
          <NavIcon icon="home" label="Home" href="/" active={isHomePage} />
          <NavIcon
            icon="group"
            label="Friends"
            href="/friend-requests"
            active={isFriendRequestsPage}
          />
          <NavIcon icon="forum" label="Messages" href="/" />
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <IconButton
            icon="apps"
            label="Menu"
            size="md"
            className="bg-[#e4e6eb] text-[#050505] hover:bg-[#d8dadf]"
            iconClassName="text-[22px]"
          />
          <IconButton
            icon="notifications"
            label="Notifications"
            size="md"
            className="bg-[#e4e6eb] text-[#050505] hover:bg-[#d8dadf]"
            iconClassName="text-[22px]"
          />
          <IconButton
            icon="logout"
            label={isLoggingOut ? "Logging out" : "Log out"}
            onClick={handleLogout}
            disabled={isLoggingOut}
            size="md"
            className="bg-[#e4e6eb] text-[#050505] hover:bg-[#d8dadf]"
            iconClassName="text-[22px]"
          />
          <Link
            to="/user/profile"
            className="hidden items-center gap-2 rounded-full p-1 pr-3 text-[#050505] hover:bg-[#f0f2f5] sm:flex"
          >
            <UserAvatar
              image={profile?.avatar}
              name={profile?.fullName}
              size="sm"
              variant="blue"
            />
            <span className="max-w-28 truncate text-sm font-semibold">
              {profile?.fullName?.split(" ")?.slice(-1)?.[0] || "Profile"}
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
};

const NavIcon = ({ icon, label, href, active = false }) => (
  <NavLink
    to={href}
    className={`flex h-12 w-24 items-center justify-center rounded-lg ${
      active
        ? "border-b-4 border-[#1877f2] text-[#1877f2]"
        : "text-[#65676b] hover:bg-[#f0f2f5]"
    }`}
    title={label}
    aria-label={label}
  >
    <span className="material-symbols-outlined text-[28px]">{icon}</span>
  </NavLink>
);

export default TopAppBar;


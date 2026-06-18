import { Link } from "react-router-dom";
import { UserAvatar } from "../../common";

const ProfileMenu = ({ profile, isLoggingOut, onLogout }) => (
  <div className="absolute right-0 top-12 z-50 w-72 rounded-lg border border-[#dddfe2] bg-white p-2 shadow-2xl">
    <Link
      to="/user/profile"
      className="flex items-center gap-3 rounded-lg p-3 text-[#111827] hover:bg-[#f2f3f5]"
    >
      <UserAvatar image={profile?.avatar} name={profile?.fullName} size="sm" />
      <div className="min-w-0">
        <p className="truncate text-sm font-bold">
          {profile?.fullName || "Hexa Pentania"}
        </p>
        <p className="text-xs text-[#6b7280]">View your profile</p>
      </div>
    </Link>

    <div className="my-1 h-px bg-[#e5e7eb]" />

    <button
      type="button"
      onClick={onLogout}
      disabled={isLoggingOut}
      className="flex w-full items-center gap-3 rounded-lg p-3 text-left text-sm font-semibold text-[#111827] hover:bg-[#f2f3f5] disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f1f3f5]">
        <span className="material-symbols-outlined text-[20px]">logout</span>
      </span>
      {isLoggingOut ? "Logging out..." : "Log out"}
    </button>
  </div>
);

export default ProfileMenu;


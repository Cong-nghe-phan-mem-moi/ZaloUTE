import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { groupAPI } from "../../services/group.service";
import getImageUrl from "../../utils/imageUrl";
import { menuItems } from "./homeData";

const getGroupId = (group) => group?._id || group?.id || "";

const getGroupInitials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "G";

const LeftSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [groupsLoading, setGroupsLoading] = useState(false);

  useEffect(() => {
    let active = true;

    const loadGroups = async () => {
      setGroupsLoading(true);

      try {
        const response = await groupAPI.getMyGroups();

        if (active) {
          setGroups(response.data?.data || []);
        }
      } catch (error) {
        console.error("Unable to load sidebar groups:", error);

        if (active) {
          setGroups([]);
        }
      } finally {
        if (active) {
          setGroupsLoading(false);
        }
      }
    };

    loadGroups();

    return () => {
      active = false;
    };
  }, []);

  const shortcutGroups = useMemo(() => groups.slice(0, 5), [groups]);

  const scrollToComposer = () => {
    const composer = document.getElementById("create-post-composer");
    if (!composer) return;

    composer.scrollIntoView({ behavior: "smooth", block: "start" });
    const textarea = composer.querySelector("textarea");
    textarea?.focus();
  };

  const handleCreatePostClick = () => {
    if (location.pathname === "/" || location.pathname === "/home") {
      scrollToComposer();
      return;
    }

    navigate("/");
    window.setTimeout(scrollToComposer, 250);
  };

  return (
    <aside className="sticky top-20 hidden h-[calc(100vh-80px)] overflow-y-auto bg-white px-8 py-5 lg:block">
      <button
        type="button"
        onClick={handleCreatePostClick}
        className="mb-7 h-11 w-full rounded-md bg-[#1877f2] text-sm font-semibold text-white shadow-md hover:bg-[#166fe5]"
      >
        Create New Post
      </button>

      <nav className="space-y-1">
        {menuItems.map((item) => (
          <Link
            key={item.label}
            to={item.href}
            className="flex items-center gap-4 rounded-lg px-1 py-3 text-sm font-semibold hover:bg-[#f2f3f5]"
          >
            <span className="material-symbols-outlined text-[22px] text-[#0b66c3]">
              {item.icon}
            </span>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="my-5 h-px bg-[#e5e7eb]" />

      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold">Your shortcuts</h2>
        {groups.length > shortcutGroups.length ? (
          <Link to="/groups" className="text-xs font-semibold text-[#0b66c3]">
            See All
          </Link>
        ) : null}
      </div>

      {groupsLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="flex items-center gap-4">
              <span className="h-9 w-9 animate-pulse rounded bg-[#f1f5f9]" />
              <span className="h-4 flex-1 animate-pulse rounded bg-[#f1f5f9]" />
            </div>
          ))}
        </div>
      ) : shortcutGroups.length > 0 ? (
        <div className="space-y-3">
          {shortcutGroups.map((group) => {
            const groupId = getGroupId(group);

            return (
              <Link
                key={groupId}
                to={`/groups/${groupId}`}
                className="flex min-w-0 items-center gap-4 rounded-lg px-1 py-1.5 text-sm font-semibold hover:bg-[#f2f3f5]"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded bg-[#f1f5f9] text-xs text-[#0b66c3]">
                  {group.avatar ? (
                    <img
                      src={getImageUrl(group.avatar)}
                      alt={group.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    getGroupInitials(group.name)
                  )}
                </span>
                <span className="truncate">{group.name}</span>
              </Link>
            );
          })}
        </div>
      ) : (
        <Link
          to="/groups"
          className="flex items-center gap-3 rounded-lg bg-[#f8fafc] px-3 py-3 text-sm font-semibold text-[#0b66c3] hover:bg-[#eef5ff]"
        >
          <span className="material-symbols-outlined text-[20px]">groups</span>
          Join or create groups
        </Link>
      )}
    </aside>
  );
};

export default LeftSidebar;

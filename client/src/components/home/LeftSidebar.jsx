import { Link, useLocation, useNavigate } from "react-router-dom";
import { menuItems, shortcuts } from "./homeData";

const LeftSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

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
      <Link
        className="block px-1 py-3 text-sm font-semibold text-[#0b66c3]"
        to="/"
      >
        See More
      </Link>
    </nav>

    <div className="my-5 h-px bg-[#e5e7eb]" />

    <h2 className="mb-4 text-sm font-bold">Your shortcuts</h2>
    <div className="space-y-4">
      {shortcuts.map((shortcut) => (
        <div
          key={shortcut.label}
          className="flex items-center gap-4 text-sm font-semibold"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded bg-[#f1f5f9] text-xs text-[#0b66c3]">
            {shortcut.initials}
          </span>
          {shortcut.label}
        </div>
      ))}
    </div>
    </aside>
  );
};

export default LeftSidebar;

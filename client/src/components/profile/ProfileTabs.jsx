const tabs = [
  { key: "introduction", label: "Introduction", icon: "menu_book" },
  { key: "posts", label: "Posts", icon: "article" },
  { key: "about", label: "About", icon: "info" },
  { key: "media", label: "Photos & Videos", icon: "photo_library" },
  { key: "friends", label: "Friends", icon: "groups" },
];

export default function ProfileTabs({ activeTab, onChange }) {
  return (
    <div className="rounded-lg bg-white shadow-sm">
      <div className="grid grid-cols-5 border-b border-[#e5e7eb] px-1 sm:px-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onChange(tab.key)}
              className={`flex min-w-0 items-center justify-center gap-1 border-b-2 px-1 py-3 text-xs font-semibold transition-colors sm:gap-2 sm:px-4 sm:py-4 sm:text-sm ${
                isActive
                  ? "border-[#1877f2] text-[#1877f2]"
                  : "border-transparent text-[#6b7280] hover:text-[#111827]"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {tab.icon}
              </span>
              <span className="hidden truncate min-[420px]:inline">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

const tabs = [
  { key: "introduction", label: "Introduction", icon: "menu_book" },
  { key: "posts", label: "Posts", icon: "article" },
  { key: "about", label: "About", icon: "info" },
  { key: "media", label: "Photos & Videos", icon: "photo_library" },
  { key: "friends", label: "Friends", icon: "groups" },
];

export default function ProfileTabs({ activeTab, onChange }) {
  return (
    <div className="overflow-x-auto rounded bg-white shadow-sm">
      <div className="flex min-w-max border-b border-[#e5e7eb] px-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onChange(tab.key)}
              className={`flex items-center gap-2 border-b-2 px-5 py-4 text-sm font-semibold transition-colors ${
                isActive
                  ? "border-[#1877f2] text-[#1877f2]"
                  : "border-transparent text-[#6b7280] hover:text-[#111827]"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {tab.icon}
              </span>
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
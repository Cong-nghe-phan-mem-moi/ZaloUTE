const socialConfig = [
  { key: "facebook", label: "Facebook", icon: "language" },
  { key: "instagram", label: "Instagram", icon: "photo_camera" },
  { key: "tiktok", label: "TikTok", icon: "music_note" },
  { key: "youtube", label: "YouTube", icon: "smart_display" },
  { key: "website", label: "Website", icon: "public" },
];

const normalizeUrl = (value) => {
  if (!value) return "";
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
};

export default function ProfileAboutTab({ profile, showSocialLinks = true }) {
  const items = [
    { icon: "call", label: "Phone Number", value: profile?.phone || "Not updated" },
    { icon: "person", label: "Gender", value: profile?.gender || "Not updated" },
    {
      icon: "cake",
      label: "Birthday",
      value: profile?.dateOfBirth
        ? new Date(profile.dateOfBirth).toLocaleDateString()
        : "Not updated",
    },
    { icon: "location_on", label: "Address", value: profile?.address || "Not updated" },
    {
      icon: "history",
      label: "Member since",
      value: profile?.createdAt
        ? new Date(profile.createdAt).toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          })
        : "Not updated",
    },
  ];

  return (
    <div className={`grid grid-cols-1 gap-5 ${showSocialLinks ? "lg:grid-cols-2" : ""}`}>
      <section className="rounded bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-[#111827]">Introduction</h2>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-[#6b7280]">Bio</p>
            <p className="mt-1 text-sm leading-6 text-[#111827]">{profile?.bio || "No bio yet."}</p>
          </div>
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.label} className="flex items-start gap-3 text-sm">
                <span className="material-symbols-outlined text-[18px] text-[#1877f2]">{item.icon}</span>
                <div>
                  <p className="font-semibold text-[#111827]">{item.label}</p>
                  <p className="text-[#6b7280]">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {showSocialLinks ? (
        <section className="rounded bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-[#111827]">Social links</h2>
          <div className="space-y-3">
            {socialConfig.map((item) => {
              const value = profile?.socialLinks?.[item.key];
              const href = normalizeUrl(value);

              return (
                <div key={item.key} className="flex items-start gap-3 text-sm">
                  <span className="material-symbols-outlined text-[18px] text-[#1877f2]">{item.icon}</span>
                  <div className="min-w-0">
                    <p className="font-semibold text-[#111827]">{item.label}</p>
                    {value ? (
                      <a href={href} target="_blank" rel="noreferrer" className="break-all text-[#1877f2] hover:underline">
                        {value}
                      </a>
                    ) : (
                      <p className="text-[#6b7280]">Not updated</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}
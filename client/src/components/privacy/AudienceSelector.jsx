import { getPrivacyOption, PRIVACY_OPTIONS } from "../../utils/privacy";

const getFriendId = (friend) =>
  String(friend?._id || friend?.id || friend?.userId || "");

const AudienceSelector = ({
  friends = [],
  privacy,
  onChange,
  compact = false,
  className = "",
}) => {
  const activeOption = getPrivacyOption(privacy?.type);
  const selectedIds =
    activeOption.value === "custom"
      ? privacy?.allowedViewers || []
      : privacy?.hiddenViewers || [];
  const selectedSet = new Set(selectedIds.map(String));
  const shouldShowPeoplePicker =
    activeOption.value === "custom" || activeOption.value === "hide_some";

  const updateType = (type) => {
    onChange({
      type,
      allowedViewers: type === "custom" ? privacy?.allowedViewers || [] : [],
      hiddenViewers: type === "hide_some" ? privacy?.hiddenViewers || [] : [],
    });
  };

  const togglePerson = (friendId) => {
    const nextSelected = selectedSet.has(friendId)
      ? selectedIds.filter((id) => String(id) !== friendId)
      : [...selectedIds, friendId];

    onChange({
      type: activeOption.value,
      allowedViewers: activeOption.value === "custom" ? nextSelected : [],
      hiddenViewers: activeOption.value === "hide_some" ? nextSelected : [],
    });
  };

  return (
    <div className={className}>
      {compact ? null : (
        <label className="mb-1 block text-xs font-bold uppercase text-[#6b7280]">
          Privacy
        </label>
      )}
      <div className="relative">
        <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[#4b5563]">
          {activeOption.icon}
        </span>
        <select
          value={activeOption.value}
          onChange={(event) => updateType(event.target.value)}
          className={`w-full rounded-md border border-[#d1d5db] bg-white pl-10 pr-8 font-semibold text-[#111827] outline-none focus:border-[#1877f2] ${
            compact ? "py-1 text-xs" : "py-2 text-sm"
          }`}
        >
          {PRIVACY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {compact ? null : (
        <p className="mt-1 text-xs text-[#6b7280]">
          {activeOption.description}
        </p>
      )}

      {shouldShowPeoplePicker ? (
        <div className="mt-3 max-h-44 overflow-y-auto rounded-md border border-[#e5e7eb]">
          {friends.length === 0 ? (
            <p className="px-3 py-3 text-sm text-[#6b7280]">
              No friends to choose.
            </p>
          ) : (
            friends.map((friend) => {
              const friendId = getFriendId(friend);
              if (!friendId) return null;

              return (
                <label
                  key={friendId}
                  className="flex cursor-pointer items-center gap-3 border-b border-[#f3f4f6] px-3 py-2 last:border-b-0 hover:bg-[#f8fafc]"
                >
                  <input
                    type="checkbox"
                    checked={selectedSet.has(friendId)}
                    onChange={() => togglePerson(friendId)}
                    className="h-4 w-4 accent-[#1877f2]"
                  />
                  <img
                    src={friend.avatar || "/default-avatar.svg"}
                    alt={friend.fullName}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-[#111827]">
                    {friend.fullName}
                  </span>
                </label>
              );
            })
          )}
        </div>
      ) : null}
    </div>
  );
};

export default AudienceSelector;

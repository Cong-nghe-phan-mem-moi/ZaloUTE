import { UserAvatar } from "../common";

const GroupSidebar = ({
  conversation,
  profile,
  onLeaveGroup,
  onRemoveMember,
  onAddMemberClick,
}) => {
  const currentUserId = profile?.id || profile?.userId;
  const isAdmin = conversation?.admin?._id
    ? conversation.admin._id.toString() === currentUserId?.toString()
    : conversation?.admin?.toString() === currentUserId?.toString();

  return (
    <aside className="hidden h-full min-h-0 flex-col overflow-y-auto border-l border-gray-200 bg-white px-6 py-6 lg:flex">
      <div className="mb-6 flex flex-col items-center border-b border-gray-100 pb-6">
        <UserAvatar image={conversation.avatar} name={conversation.name} size="lg" />
        <h3 className="mt-3 text-center text-lg font-bold text-gray-900">
          {conversation.name}
        </h3>
        <span className="mt-2 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-600">
          Group ({conversation.participants?.length || 0} members)
        </span>
      </div>

      <div className="flex-1">
        <div className="mb-4">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Group members
            </h4>
            <button
              type="button"
              onClick={onAddMemberClick}
              className="flex items-center justify-center rounded-full p-1 text-blue-600 transition hover:scale-105 hover:bg-gray-100"
              title="Add members"
            >
              <span className="material-symbols-outlined text-[18px]">
                person_add
              </span>
            </button>
          </div>

          <div className="space-y-3">
            {conversation.participants?.map((member) => {
              const isMemberAdmin = conversation.admin?._id
                ? conversation.admin._id.toString() === member._id.toString()
                : conversation.admin?.toString() === member._id.toString();
              const isSelf =
                member._id.toString() === currentUserId?.toString();

              return (
                <div
                  key={member._id}
                  className="flex items-center justify-between gap-3 rounded-lg p-1 hover:bg-gray-50"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <UserAvatar
                      image={member.avatar}
                      name={member.fullName}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-800">
                        {member.fullName}{" "}
                        {isSelf ? (
                          <span className="text-xs font-normal text-gray-400">
                            (You)
                          </span>
                        ) : null}
                      </p>
                      {isMemberAdmin ? (
                        <span className="mt-0.5 flex items-center gap-0.5 text-[10px] font-bold text-amber-600">
                          <span className="material-symbols-outlined text-[12px]">
                            shield
                          </span>
                          Group Admin
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {isAdmin && !isMemberAdmin ? (
                    <button
                      type="button"
                      onClick={() => onRemoveMember(member._id)}
                      className="rounded-full p-1 text-red-500 transition hover:scale-105 hover:bg-red-50"
                      title="Remove from group"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        person_remove
                      </span>
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-auto border-t border-gray-100 pt-4">
        <button
          type="button"
          onClick={onLeaveGroup}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:scale-[1.02] hover:bg-red-100"
        >
          <span className="material-symbols-outlined text-[18px]">logout</span>
          Leave group
        </button>
      </div>
    </aside>
  );
};

export default GroupSidebar;


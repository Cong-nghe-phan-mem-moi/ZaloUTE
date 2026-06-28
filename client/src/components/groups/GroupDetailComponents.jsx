import { Link } from "react-router-dom";
import { UserAvatar } from "../common";
import getImageUrl from "../../utils/imageUrl";
import GroupAvatarUploader from "./GroupAvatarUploader";

const getId = (item) => item?._id || item?.id || item?.userId || item || "";

const listConfigs = {
  members: {
    icon: "groups",
    label: "Members",
    emptyText: "This group has no members yet.",
  },
  admins: {
    icon: "admin_panel_settings",
    label: "Admin",
    emptyText: "This group has no admins yet.",
  },
  invites: {
    icon: "mail",
    label: "Pending invites",
    emptyText: "No pending invites.",
  },
  requests: {
    icon: "how_to_reg",
    label: "Pending requests",
    emptyText: "No pending join requests.",
  },
  creator: {
    icon: "person",
    label: "Creator",
    emptyText: "Unknown group creator.",
  },
  privacy: {
    icon: "public",
    label: "Privacy",
    emptyText: "",
  },
};

export const GroupHero = ({
  group,
  accepting,
  requesting,
  onAcceptInvite,
  onRequestJoin,
  onEdit,
}) => (
  <section className="overflow-hidden rounded-lg bg-white shadow-sm">
    <div className="relative h-40 bg-gradient-to-br from-[#e8f1ff] via-[#cfe1ff] to-[#9fc5ff] sm:h-52 lg:h-60">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.18),rgba(15,23,42,0.08))]" />
      <div className="absolute bottom-5 right-6 hidden items-center gap-2 rounded-md bg-white/90 px-4 py-2 text-sm font-semibold text-[#111827] shadow-sm sm:flex">
        <span className="material-symbols-outlined text-[18px]">
          collections_bookmark
        </span>
        Group profile
      </div>
    </div>

    <div className="px-4 pb-5 sm:px-6 sm:pb-7 lg:px-8">
      <div className="relative -mt-12 flex flex-col gap-4 sm:-mt-16">
        <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:gap-5">
          <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-white bg-[#dbeafe] text-[#1877f2] shadow-md sm:h-32 sm:w-32 lg:h-36 lg:w-36">
            {group.avatar ? (
              <img
                className="h-full w-full object-cover"
                src={getImageUrl(group.avatar)}
                alt={group.name}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <span className="material-symbols-outlined text-[42px]">
                  groups
                </span>
              </div>
            )}
          </div>

          <div className="mb-2 min-w-0 flex-1 sm:mb-3">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="min-w-0 truncate text-2xl font-bold text-[#111827] sm:text-3xl">
                {group.name}
              </h1>
              <span className="rounded-full bg-[#eef5ff] px-3 py-1 text-xs font-semibold text-[#1877f2]">
                {group.isPrivate ? "Private" : "Public"}
              </span>
            </div>
            <p className="mt-2 text-sm text-[#6b7280]">
              {group.members?.length || 0} members
              {group.isCurrentUserAdmin ? " - You are an admin" : ""}
            </p>
          </div>
        </div>

        {group.description ? (
          <p className="max-w-2xl text-sm leading-6 text-[#4b5563]">
            {group.description}
          </p>
        ) : null}

        <div className="grid w-full gap-2 sm:flex sm:w-auto sm:flex-wrap">
          {group.hasPendingInvite && !group.isCurrentUserMember ? (
            <button
              type="button"
              onClick={onAcceptInvite}
              disabled={accepting}
              className="flex items-center justify-center gap-2 rounded-md bg-[#1877f2] px-5 py-2 text-sm font-semibold text-white hover:bg-[#166fe5] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-[18px]">
                how_to_reg
              </span>
              {accepting ? "Joining..." : "Accept invitation"}
            </button>
          ) : null}

          {!group.isCurrentUserMember && !group.isCurrentUserAdmin && !group.hasPendingInvite ? (
            group.hasPendingRequest ? (
              <button
                type="button"
                disabled
                className="flex cursor-not-allowed items-center justify-center gap-2 rounded-md bg-[#e5e7eb] px-5 py-2 text-sm font-semibold text-[#6b7280]"
              >
                <span className="material-symbols-outlined text-[18px]">
                  pending
                </span>
                Pending approval
              </button>
            ) : (
              <button
                type="button"
                onClick={onRequestJoin}
                disabled={requesting}
                className="flex items-center justify-center gap-2 rounded-md bg-[#1877f2] px-5 py-2 text-sm font-semibold text-white hover:bg-[#166fe5] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="material-symbols-outlined text-[18px]">
                  group_add
                </span>
                {requesting ? "Sending..." : "Request to join"}
              </button>
            )
          ) : null}

          {group.isCurrentUserAdmin ? (
            <button
              type="button"
              onClick={onEdit}
              className="flex items-center justify-center gap-2 rounded-md bg-[#e7f3ff] px-5 py-2 text-sm font-semibold text-[#1877f2] hover:bg-[#dbeafe]"
            >
              <span className="material-symbols-outlined text-[18px]">
                edit
              </span>
              Edit group
            </button>
          ) : null}
        </div>
      </div>

      {group.hasPendingInvite && !group.isCurrentUserMember ? (
        <div className="mt-4 rounded-md bg-[#e7f3ff] px-4 py-3 text-sm font-semibold text-[#1877f2]">
          You have an invitation to this group. Accept it to add the group to your list.
        </div>
      ) : null}
      {group.hasPendingRequest && !group.isCurrentUserMember ? (
        <div className="mt-4 rounded-md bg-[#fff7ed] px-4 py-3 text-sm font-semibold text-[#c2410c]">
          Your join request is waiting for admin approval.
        </div>
      ) : null}
    </div>
  </section>
);

export const InfoPanel = ({ group }) => (
  <section className="rounded bg-white p-4 shadow-sm sm:p-5">
    <h2 className="text-base font-bold">About</h2>
    <p className="mt-3 text-sm leading-6 text-[#4b5563]">
      {group.description || "This group has no description yet."}
    </p>

    <div className="mt-5 grid gap-3 sm:grid-cols-2">
      <InfoItem
        icon={group.isPrivate ? "lock" : "public"}
        label="Privacy"
        value={group.isPrivate ? "Private group" : "Public group"}
      />
      <InfoItem
        icon="person"
        label="Creator"
        value={group.creator?.fullName || "Unknown"}
      />
      <InfoItem
        icon="admin_panel_settings"
        label="Admin"
        value={`${group.admins?.length || 0} people`}
      />
      <InfoItem
        icon="groups"
        label="Members"
        value={`${group.members?.length || 0} people`}
      />
    </div>
  </section>
);

export const PendingGroupPostsPanel = ({
  posts,
  loading,
  actionKey,
  onApprove,
  onReject,
}) => (
  <section className="rounded bg-white p-4 shadow-sm sm:p-5">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="text-base font-bold">Pending posts</h2>
        <p className="mt-1 text-xs font-semibold text-[#6b7280]">
          Member posts need admin approval before they appear.
        </p>
      </div>
      <span className="rounded-full bg-[#eef5ff] px-3 py-1 text-xs font-bold text-[#1877f2]">
        {posts.length}
      </span>
    </div>

    {loading ? (
      <div className="rounded-md bg-[#f2f3f5] p-5 text-center text-sm font-semibold text-[#6b7280]">
        Loading pending posts...
      </div>
    ) : posts.length === 0 ? (
      <div className="rounded-md bg-[#f2f3f5] p-5 text-center text-sm font-semibold text-[#6b7280]">
        No posts are pending approval.
      </div>
    ) : (
      <div className="space-y-3">
        {posts.map((post) => {
          const postId = getId(post);
          const author = post.author || {};
          const approveKey = `approve-post-${postId}`;
          const rejectKey = `reject-post-${postId}`;
          const media = Array.isArray(post.media) ? post.media : [];

          return (
            <article
              key={postId}
              className="rounded-md border border-[#eef0f2] bg-white p-4 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <UserAvatar
                  image={author.avatar}
                  name={author.fullName || "User"}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">
                    {author.fullName || "User"}
                  </p>
                  <p className="text-xs font-semibold text-[#6b7280]">
                    Pending approval
                  </p>
                </div>
              </div>

              {post.content ? (
                <p className="mt-3 whitespace-pre-line text-sm leading-6 text-[#111827]">
                  {post.content}
                </p>
              ) : null}

              {media.length > 0 ? (
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {media.slice(0, 2).map((item, index) => (
                    <div
                      key={`${postId}-media-${index}`}
                      className="h-36 overflow-hidden rounded-md bg-[#f2f3f5]"
                    >
                      {item?.type === "video" ? (
                        <video
                          className="h-full w-full object-cover"
                          src={item.url}
                          controls
                        />
                      ) : (
                        <img
                          className="h-full w-full object-cover"
                          src={item?.url || item}
                          alt=""
                        />
                      )}
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="mt-4 flex flex-wrap justify-end gap-2">
                <ActionButton
                  label={actionKey === rejectKey ? "Rejecting..." : "Reject"}
                  disabled={!!actionKey}
                  onClick={() => onReject(post)}
                />
                <ActionButton
                  label={actionKey === approveKey ? "Approving..." : "Approve post"}
                  tone="primary"
                  disabled={!!actionKey}
                  onClick={() => onApprove(post)}
                />
              </div>
            </article>
          );
        })}
      </div>
    )}
  </section>
);

const InfoItem = ({ icon, label, value }) => (
  <div className="flex items-center gap-3 rounded-md bg-[#f2f3f5] p-4">
    <span className="material-symbols-outlined text-[22px] text-[#1877f2]">
      {icon}
    </span>
    <div className="min-w-0">
      <p className="text-xs font-semibold uppercase text-[#6b7280]">{label}</p>
      <p className="truncate text-sm font-bold">{value}</p>
    </div>
  </div>
);

export const EditGroupModal = ({
  form,
  saving,
  onChange,
  onClose,
  onSubmit,
}) => (
  <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 px-3 py-3 sm:items-center sm:px-4 sm:py-8">
    <form
      onSubmit={onSubmit}
      className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-lg bg-white p-4 shadow-2xl sm:p-5"
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">Edit group</h2>
          <p className="mt-1 text-sm text-[#6b7280]">
            Update the information shown on the group page.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f2f3f5] hover:bg-[#e5e7eb]"
          aria-label="Close"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>

      <div className="space-y-4">
        <Field label="Group name">
          <input
            value={form.name}
            onChange={(event) =>
              onChange((current) => ({ ...current, name: event.target.value }))
            }
            className="h-11 w-full rounded-md border border-[#dddfe2] px-3 text-sm outline-none focus:border-[#1877f2]"
            placeholder="Group name"
            required
          />
        </Field>

        <Field label="Description">
          <textarea
            value={form.description}
            onChange={(event) =>
              onChange((current) => ({
                ...current,
                description: event.target.value,
              }))
            }
            className="min-h-24 w-full resize-none rounded-md border border-[#dddfe2] px-3 py-2 text-sm outline-none focus:border-[#1877f2]"
            placeholder="Group description"
          />
        </Field>

        <GroupAvatarUploader form={form} onChange={onChange} Field={Field} />

        <label className="flex items-center justify-between rounded-md bg-[#f2f3f5] px-4 py-3">
          <span>
            <span className="block text-sm font-semibold">Private group</span>
            <span className="text-xs text-[#6b7280]">
              Only members can view group content.
            </span>
          </span>
          <input
            type="checkbox"
            checked={form.isPrivate}
            onChange={(event) =>
              onChange((current) => ({
                ...current,
                isPrivate: event.target.checked,
              }))
            }
            className="h-5 w-5 accent-[#1877f2]"
          />
        </label>
      </div>

      <div className="mt-6 grid gap-3 sm:flex sm:justify-end">
        <button
          type="button"
          onClick={onClose}
          className="rounded-md bg-[#e5e7eb] px-5 py-2 text-sm font-semibold hover:bg-[#d1d5db]"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-[#1877f2] px-5 py-2 text-sm font-semibold text-white hover:bg-[#166fe5] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
      </div>
    </form>
  </div>
);

const Field = ({ label, children }) => (
  <label className="block">
    <span className="mb-2 block text-sm font-semibold">{label}</span>
    {children}
  </label>
);

export const ManageListPanel = ({
  activeList,
  people,
  group,
  currentUserId,
  actionKey,
  isAdminPerson,
  onApproveRequest,
  onAssignAdmin,
  onCancelInvitation,
  onRemoveMember,
  onUpdatePrivacy,
}) => {
  const config = listConfigs[activeList];
  const canManage = group.isCurrentUserAdmin;
  const isPrivacySection = activeList === "privacy";

  return (
    <section className="rounded bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#eef5ff] text-[#1877f2]">
            <span className="material-symbols-outlined text-[22px]">
              {config.icon}
            </span>
          </span>
          <div>
            <h2 className="text-base font-bold">{config.label}</h2>
            <p className="text-xs font-semibold text-[#6b7280]">
              {isPrivacySection
                ? group.isPrivate
                  ? "Private group"
                  : "Public group"
                : `${people.length} items in this list`}
            </p>
          </div>
        </div>

        {!canManage && ["invites", "requests"].includes(activeList) ? (
          <span className="rounded-full bg-[#f2f3f5] px-3 py-1 text-xs font-semibold text-[#6b7280]">
            Admins only
          </span>
        ) : null}
      </div>

      {isPrivacySection ? (
        <PrivacyManagePanel
          group={group}
          canManage={canManage}
          saving={actionKey === "privacy"}
          onUpdatePrivacy={onUpdatePrivacy}
        />
      ) : !canManage && ["invites", "requests"].includes(activeList) ? (
        <EmptyList text="You need admin permission to view this list." />
      ) : people.length === 0 ? (
        <EmptyList text={config.emptyText} />
      ) : (
        <div className="space-y-3">
          {people.map((person) => (
            <ManagedPersonRow
              key={getId(person)}
              activeList={activeList}
              person={person}
              isSelf={String(getId(person)) === currentUserId}
              isAdmin={isAdminPerson(person)}
              canManage={canManage}
              actionKey={actionKey}
              onApproveRequest={onApproveRequest}
              onAssignAdmin={onAssignAdmin}
              onCancelInvitation={onCancelInvitation}
              onRemoveMember={onRemoveMember}
            />
          ))}
        </div>
      )}
    </section>
  );
};

const PrivacyManagePanel = ({ group, canManage, saving, onUpdatePrivacy }) => (
  <div className="space-y-3">
    <div className="rounded-md bg-[#f2f3f5] p-4">
      <p className="text-sm font-bold">
        {group.isPrivate ? "Private group" : "Public group"}
      </p>
      <p className="mt-1 text-xs font-semibold text-[#6b7280]">
        {group.isPrivate
          ? "Only group members can view posts in this group."
          : "Everyone can find the group, while posts still follow their current access rules."}
      </p>
    </div>

    {canManage ? (
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          disabled={saving || !group.isPrivate}
          onClick={() => onUpdatePrivacy(false)}
          className={`rounded-md px-4 py-4 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
            !group.isPrivate
              ? "bg-[#e7f3ff] text-[#1877f2] ring-1 ring-[#b8daff]"
              : "bg-[#f2f3f5] hover:bg-[#e5e7eb]"
          }`}
        >
          <span className="material-symbols-outlined text-[22px]">public</span>
          <span className="mt-2 block text-sm font-bold">Public</span>
          <span className="mt-1 block text-xs font-semibold text-[#6b7280]">
            Allow everyone to find the group.
          </span>
        </button>

        <button
          type="button"
          disabled={saving || group.isPrivate}
          onClick={() => onUpdatePrivacy(true)}
          className={`rounded-md px-4 py-4 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
            group.isPrivate
              ? "bg-[#e7f3ff] text-[#1877f2] ring-1 ring-[#b8daff]"
              : "bg-[#f2f3f5] hover:bg-[#e5e7eb]"
          }`}
        >
          <span className="material-symbols-outlined text-[22px]">lock</span>
          <span className="mt-2 block text-sm font-bold">Private</span>
          <span className="mt-1 block text-xs font-semibold text-[#6b7280]">
            Prioritize member-only content.
          </span>
        </button>
      </div>
    ) : (
      <div className="rounded-md bg-[#f2f3f5] p-4 text-sm font-semibold text-[#6b7280]">
        Only admins can change group privacy.
      </div>
    )}
  </div>
);

const ManagedPersonRow = ({
  activeList,
  person,
  isSelf,
  isAdmin,
  canManage,
  actionKey,
  onApproveRequest,
  onAssignAdmin,
  onCancelInvitation,
  onRemoveMember,
}) => {
  const personId = getId(person);
  const approveKey = `approve-${personId}`;
  const adminKey = `admin-${personId}`;
  const cancelInviteKey = `cancel-invite-${personId}`;
  const removeMemberKey = `remove-member-${personId}`;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-white p-3 shadow-sm ring-1 ring-[#eef0f2]">
      <Link
        to={personId ? `/users/profile/${personId}` : "#"}
        className="flex min-w-0 items-center gap-3"
      >
        <UserAvatar image={person.avatar} name={person.fullName || "User"} />
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">
            {person.fullName || "User"}
          </p>
          <p className="flex items-center gap-2 text-xs text-[#6b7280]">
            <span
              className={`h-2 w-2 rounded-full ${
                person.isOnline ? "bg-emerald-500" : "bg-[#9ca3af]"
              }`}
            />
            {isSelf ? "You" : person.isOnline ? "Online" : "View profile"}
          </p>
        </div>
      </Link>

      {canManage ? (
        <div className="grid w-full gap-2 sm:w-auto sm:grid-flow-col sm:auto-cols-max">
          {activeList === "requests" ? (
            <>
              <ActionButton
                label={actionKey === approveKey ? "Approving..." : "Accept"}
                tone="primary"
                disabled={!!actionKey}
                onClick={() => onApproveRequest(person)}
              />
              <ActionButton label="Reject" disabled note="API unavailable" />
            </>
          ) : null}

          {activeList === "members" ? (
            <>
              <ActionButton
                label={actionKey === adminKey ? "Adding..." : "Add admin"}
                tone="primary"
                disabled={!!actionKey || isAdmin}
                note={isAdmin ? "Already admin" : ""}
                onClick={() => onAssignAdmin(person)}
              />
              <ActionButton
                label={actionKey === removeMemberKey ? "Removing..." : "Remove member"}
                disabled={!!actionKey || isSelf}
                note={isSelf ? "You cannot remove yourself" : ""}
                onClick={() => onRemoveMember(person)}
              />
            </>
          ) : null}

          {activeList === "admins" ? (
            <ActionButton
              label="Remove admin"
              disabled
              note={isSelf ? "Cannot remove yourself" : "API unavailable"}
            />
          ) : null}

          {activeList === "invites" ? (
            <ActionButton
              label={actionKey === cancelInviteKey ? "Removing..." : "Cancel invite"}
              disabled={!!actionKey}
              onClick={() => onCancelInvitation(person)}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

const ActionButton = ({
  label,
  tone = "neutral",
  disabled = false,
  note = "",
  onClick,
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={note || label}
    className={`rounded-md px-3 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-55 ${
      tone === "primary"
        ? "bg-[#1877f2] text-white hover:bg-[#166fe5]"
        : "bg-[#e5e7eb] text-[#111827] hover:bg-[#d1d5db]"
    }`}
  >
    {label}
  </button>
);

export const SummaryPanel = ({
  activeList,
  counts,
  isCurrentUserAdmin,
  onSelect,
}) => (
    <section className="rounded bg-white p-4 shadow-sm sm:p-5">
    <div className="mb-4">
      <h2 className="text-base font-bold">Group management</h2>
      <p className="mt-1 text-xs font-semibold text-[#6b7280]">
        Click a row to open the list.
      </p>
    </div>

    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
      {Object.entries(listConfigs).map(([key, item]) => {
        const locked = !isCurrentUserAdmin && ["invites", "requests"].includes(key);
        return (
          <button
            type="button"
            key={key}
            onClick={() => onSelect(key)}
            disabled={locked}
            className={`flex w-full items-center justify-between rounded-md px-4 py-4 text-left transition ${
              activeList === key
                ? "bg-[#e7f3ff] text-[#1877f2] ring-1 ring-[#b8daff]"
                : "bg-[#f2f3f5] hover:bg-[#e5e7eb]"
            } disabled:cursor-not-allowed disabled:opacity-60`}
          >
            <span className="flex min-w-0 items-center gap-3">
              <span className="material-symbols-outlined text-[20px]">
                {key === "privacy" && counts[key] === "Private"
                  ? "lock"
                  : item.icon}
              </span>
              <span className="truncate text-sm font-bold">{item.label}</span>
            </span>
            <span className="text-base font-bold">{counts[key]}</span>
          </button>
        );
      })}
    </div>
  </section>
);

/*
const MiniPeoplePanel = ({ people }) => (
  <>
    {people.length === 0 ? (
      <p className="text-sm font-semibold text-[#6b7280]">No data yet.</p>
    ) : (
      <div className="space-y-3">
        {people.map((person) => (
          <PersonMiniCard key={getId(person)} person={person} />
        ))}
      </div>
    )}
  </section>
);

const PersonMiniCard = ({ person }) => {
  const personId = getId(person);

  return (
    <Link
      to={personId ? `/users/profile/${personId}` : "#"}
      className="flex items-center gap-3 rounded-md hover:bg-[#f2f3f5]"
    >
      <UserAvatar image={person.avatar} name={person.fullName || "User"} />
      <div className="min-w-0">
        <p className="truncate text-sm font-bold">
          {person.fullName || "User"}
        </p>
        <p className="flex items-center gap-2 text-xs text-[#6b7280]">
          <span
            className={`h-2 w-2 rounded-full ${
              person.isOnline ? "bg-emerald-500" : "bg-[#9ca3af]"
            }`}
          />
          {person.isOnline ? "Online" : "View profile"}
        </p>
      </div>
    </Link>
  );
};

*/
const EmptyList = ({ text }) => (
  <div className="rounded-md bg-[#f2f3f5] p-5 text-center text-sm font-semibold text-[#6b7280]">
    {text}
  </div>
);

export const StatusCard = ({ icon, message, detail, tone = "neutral", loading }) => (
  <section
    className={`rounded bg-white p-7 text-center shadow-sm ${
      tone === "error" ? "text-red-600" : "text-[#6b7280]"
    }`}
  >
    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#f2f3f5]">
      <span
        className={`material-symbols-outlined text-[24px] ${
          loading ? "animate-spin" : ""
        }`}
      >
        {icon}
      </span>
    </div>
    <p className="text-sm font-semibold">{message}</p>
    {detail ? <p className="mt-1 text-xs text-[#9ca3af]">{detail}</p> : null}
  </section>
);




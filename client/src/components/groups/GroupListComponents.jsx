import { useMemo } from "react";
import { Link } from "react-router-dom";
import { UserAvatar } from "../common";
import getImageUrl from "../../utils/imageUrl";
import GroupAvatarUploader from "./GroupAvatarUploader";

const getGroupEntityId = (item) =>
  item?._id || item?.id || item?.userId || item || "";

export const InvitationPanel = ({ invitations, actionKey, onAccept, onReject }) => (
  <section className="rounded-lg bg-white p-5 shadow-sm">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="text-xs font-semibold uppercase text-[#1877f2]">
          Group invitations
        </p>
        <h2 className="mt-1 text-base font-bold">
          {invitations.length} pending invitations
        </h2>
      </div>
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e7f3ff] text-[#1877f2]">
        <span className="material-symbols-outlined text-[22px]">mail</span>
      </span>
    </div>

    <div className="grid gap-4 xl:grid-cols-2">
      {invitations.map((group) => {
        const groupId = getGroupEntityId(group);
        const accepting = actionKey === `accept-${groupId}`;
        const rejecting = actionKey === `reject-${groupId}`;

        return (
          <article
            key={groupId}
            className="rounded-lg border border-[#e5e7eb] bg-[#f8fafc] p-4"
          >
            <div className="flex gap-3 sm:gap-4">
              <GroupAvatar group={group} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate text-base font-bold">{group.name}</h3>
                  <span className="rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-[#1877f2]">
                    {group.isPrivate ? "Private" : "Public"}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-[#6b7280]">
                  {group.description || "You were invited to join this group."}
                </p>
                <p className="mt-2 text-xs font-semibold text-[#6b7280]">
                  {group.creator?.fullName
                    ? `${group.creator.fullName} invited you`
                    : "You have a group invitation"}
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => onAccept(group)}
                disabled={!!actionKey}
                className="flex items-center justify-center gap-2 rounded-md bg-[#1877f2] px-4 py-2 text-sm font-semibold text-white hover:bg-[#166fe5] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="material-symbols-outlined text-[18px]">
                  how_to_reg
                </span>
                {accepting ? "Accepting..." : "Accept"}
              </button>
              <button
                type="button"
                onClick={() => onReject(group)}
                disabled={!!actionKey}
                className="flex items-center justify-center gap-2 rounded-md bg-[#e5e7eb] px-4 py-2 text-sm font-semibold text-[#111827] hover:bg-[#d1d5db] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="material-symbols-outlined text-[18px]">
                  close
                </span>
                {rejecting ? "Rejecting..." : "Reject"}
              </button>
            </div>
          </article>
        );
      })}
    </div>
  </section>
);

export const GroupCard = ({
  group,
  currentUserId,
  onEdit,
  onInvite,
  onAssignAdmin,
}) => {
  const memberCount = group.members?.length || 0;
  const adminCount = group.admins?.length || 0;
  const isAdmin = (group.admins || []).some(
    (adminId) => String(getGroupEntityId(adminId)) === currentUserId,
  );

  return (
    <article className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-[#eef0f2] transition hover:-translate-y-0.5 hover:shadow-md">
      <Link
        to={`/groups/${getGroupEntityId(group)}`}
        className="flex items-start gap-3 rounded-md hover:bg-[#f8fafc] sm:gap-4"
      >
        <GroupAvatar group={group} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-bold">{group.name}</h3>
            <span className="rounded-full bg-[#eef5ff] px-2 py-1 text-[11px] font-semibold text-[#1877f2]">
              {group.isPrivate ? "Private" : "Public"}
            </span>
          </div>
          <p className="mt-1 line-clamp-2 text-sm text-[#6b7280]">
            {group.description || "No group description yet."}
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-[#6b7280]">
            <span className="rounded bg-[#f2f3f5] px-3 py-1">
              {memberCount} members
            </span>
            <span className="rounded bg-[#f2f3f5] px-3 py-1">
              {adminCount} admin
            </span>
            {isAdmin ? (
              <span className="rounded bg-[#e7f3ff] px-3 py-1 text-[#1877f2]">
                You are an admin
              </span>
            ) : null}
          </div>
        </div>
      </Link>

      {isAdmin ? (
        <div className="mt-4 grid gap-2 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
          <GroupCardButton icon="edit" label="Edit" onClick={onEdit} />
          <GroupCardButton
            icon="person_add"
            label="Invite friends"
            tone="primary"
            onClick={onInvite}
          />
          <GroupCardButton
            icon="admin_panel_settings"
            label="Add admin"
            tone="soft"
            onClick={onAssignAdmin}
          />
        </div>
      ) : null}
    </article>
  );
};

const GroupCardButton = ({ icon, label, tone = "neutral", onClick }) => {
  const toneClass =
    tone === "primary"
      ? "bg-[#1877f2] text-white hover:bg-[#166fe5]"
      : tone === "soft"
        ? "bg-[#e7f3ff] text-[#1877f2] hover:bg-[#dbeafe]"
        : "bg-[#f2f3f5] hover:bg-[#e5e7eb]";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-center gap-1 rounded-md px-3 py-2 text-xs font-semibold ${toneClass}`}
    >
      <span className="material-symbols-outlined text-[15px]">{icon}</span>
      {label}
    </button>
  );
};

export const GroupAvatar = ({ group }) => (
  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md bg-[#dbeafe] text-xl font-bold text-[#1877f2] sm:h-16 sm:w-16">
    {group.avatar ? (
      <img
        className="h-full w-full object-cover"
        src={getImageUrl(group.avatar)}
        alt={group.name}
      />
    ) : (
      <span className="material-symbols-outlined text-[30px]">groups</span>
    )}
  </div>
);

export const GroupModal = ({
  mode,
  group,
  form,
  friends,
  actionLoading,
  onChange,
  onToggleFriend,
  onClose,
  onCreate,
  onUpdate,
  onInvite,
  onAssignAdmin,
}) => {
  const isCreate = mode === "create";
  const isEdit = mode === "edit";
  const isInvite = mode === "invite";
  const memberIds = (group?.members || []).map((member) => String(getGroupEntityId(member)));
  const adminIds = (group?.admins || []).map((admin) => String(getGroupEntityId(admin)));
  const assignableMembers = (group?.members || [])
    .map((member) => ({
      id: getGroupEntityId(member),
      fullName: member?.fullName || member?.name || "Group member",
      avatar: member?.avatar || member?.image || null,
    }))
    .filter((member) => member.id);
  const title = isCreate
    ? "Create group"
    : isEdit
      ? "Edit groups"
      : isInvite
        ? "Invite friends"
        : "Assign admin";
  const submitLabel = actionLoading
    ? "Saving..."
    : isCreate
      ? "Create group"
      : isEdit
        ? "Save changes"
        : isInvite
          ? "Send invitation"
          : "Assign";
  const submitHandler = isCreate
    ? onCreate
    : isEdit
      ? onUpdate
      : isInvite
        ? onInvite
        : onAssignAdmin;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 px-3 py-3 sm:items-center sm:px-4 sm:py-8">
      <form
        onSubmit={submitHandler}
        className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-lg bg-white p-4 shadow-2xl sm:p-5"
      >
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">{title}</h2>
            {group ? (
              <p className="mt-1 text-sm text-[#6b7280]">{group.name}</p>
            ) : null}
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

        {isCreate || isEdit ? (
          <GroupFormFields form={form} onChange={onChange} isCreate={isCreate} />
        ) : null}

        {isCreate || isInvite || mode === "admin" ? (
          <FriendPicker
            friends={mode === "admin" ? assignableMembers : friends}
            selectedIds={form.invitedUserIds}
            single={mode === "admin"}
            disabledIds={isInvite ? memberIds : mode === "admin" ? adminIds : []}
            disabledReasonType={mode}
            disabledLabel="Already in group"
            onToggleFriend={onToggleFriend}
          />
        ) : null}

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
            disabled={
              actionLoading ||
              ((isInvite || mode === "admin") && form.invitedUserIds.length === 0)
            }
            className="rounded-md bg-[#1877f2] px-5 py-2 text-sm font-semibold text-white hover:bg-[#166fe5] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
};

const GroupFormFields = ({ form, onChange, isCreate }) => (
  <div className="space-y-4">
    <Field label="Group name">
      <input
        value={form.name}
        onChange={(event) =>
          onChange((current) => ({ ...current, name: event.target.value }))
        }
        className="h-11 w-full rounded-md border border-[#dddfe2] px-3 text-sm outline-none focus:border-[#1877f2]"
        placeholder={isCreate ? "Example: Software Engineering Study Group" : "Group name"}
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
        placeholder={isCreate ? "Use this group to discuss..." : "Group description"}
      />
    </Field>

    <GroupAvatarUploader form={form} onChange={onChange} Field={Field} />

    <label className="flex items-center justify-between rounded-md bg-[#f2f3f5] px-4 py-3">
      <span>
        <span className="block text-sm font-semibold">Private group</span>
        <span className="text-xs text-[#6b7280]">
          Members must be invited or approved before joining.
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
);

export const FriendPicker = ({
  friends,
  selectedIds,
  single = false,
  disabledIds = [],
  disabledReasonType = "",
  disabledLabel = "Cannot select",
  onToggleFriend,
}) => {
  const disabledIdSet = useMemo(
    () => new Set(disabledIds.map((id) => String(id))),
    [disabledIds],
  );

  return (
    <div className="mt-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold">
          {single ? "Choose member" : "Invite friends"}
        </h3>
        <span className="text-xs font-semibold text-[#6b7280]">
          {selectedIds.length} selected
        </span>
      </div>

      {friends.length === 0 ? (
        <div className="rounded-md bg-[#f2f3f5] p-4 text-center text-sm font-semibold text-[#6b7280]">
          No friends to choose from.
        </div>
      ) : (
        <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
          {friends.map((friend) => {
            const disabled = disabledIdSet.has(String(friend.id));
            const selected = selectedIds.includes(friend.id);
            const disabledText = disabledReasonType === "admin"
              ? "Already admin"
              : disabledLabel;

            return (
              <button
                type="button"
                key={friend.id}
                disabled={disabled}
                onClick={() => {
                  if (disabled) return;
                  if (single && !selected && selectedIds.length > 0) {
                    selectedIds.forEach(onToggleFriend);
                  }
                  onToggleFriend(friend.id);
                }}
                className={`flex w-full items-center justify-between rounded-md p-3 text-left ${
                  disabled
                    ? "cursor-not-allowed bg-[#f2f3f5] opacity-70"
                    : selected
                      ? "bg-[#eef5ff] hover:bg-[#e7f3ff]"
                      : "bg-white hover:bg-[#f2f3f5]"
                }`}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <UserAvatar image={friend.avatar} name={friend.fullName} size="sm" />
                  <span className="truncate text-sm font-semibold">
                    {friend.fullName}
                  </span>
                </span>
                {disabled ? (
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#6b7280]">
                    {disabledText}
                  </span>
                ) : (
                  <span
                    className={`material-symbols-outlined text-[22px] ${
                      selected ? "text-[#1877f2]" : "text-[#9ca3af]"
                    }`}
                  >
                    {selected ? "check_circle" : "radio_button_unchecked"}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const Field = ({ label, children }) => (
  <label className="block">
    <span className="mb-2 block text-sm font-semibold">{label}</span>
    {children}
  </label>
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



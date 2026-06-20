import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { UserAvatar } from "../../components/common";
import HomeHeader from "../../components/home/HomeHeader";
import LeftSidebar from "../../components/home/LeftSidebar";
import RightSidebar from "../../components/home/RightSidebar";
import { groupAPI } from "../../services/api";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { fetchUserProfile } from "../../redux/slices/userSlice";

const getId = (item) => item?._id || item?.id || item?.userId || item || "";

const emptyGroupForm = {
  name: "",
  description: "",
  avatar: "",
  isPrivate: false,
  invitedUserIds: [],
};

const Groups = () => {
  const dispatch = useAppDispatch();
  const { profile } = useAppSelector((state) => state.user);
  const [groups, setGroups] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [inviteActionKey, setInviteActionKey] = useState("");
  const [activeModal, setActiveModal] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [form, setForm] = useState(emptyGroupForm);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const friends = useMemo(() => {
    if (!Array.isArray(profile?.friends)) return [];

    return profile.friends
      .map((friend) => ({
        id: getId(friend),
        fullName: friend?.fullName || friend?.name || "Bạn bè",
        avatar: friend?.avatar || friend?.image || null,
        isOnline: friend?.isOnline || false,
      }))
      .filter((friend) => friend.id);
  }, [profile]);

  const contacts = useMemo(
    () =>
      friends.map((friend) => ({
        id: friend.id,
        name: friend.fullName,
        avatar: friend.avatar,
        status: friend.isOnline ? "Online" : "View profile",
        online: friend.isOnline,
      })),
    [friends],
  );

  const loadGroups = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [groupsResponse, invitationsResponse] = await Promise.all([
        groupAPI.getMyGroups(),
        groupAPI.getInvitations(),
      ]);
      setGroups(groupsResponse.data?.data || []);
      setInvitations(invitationsResponse.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Không thể tải danh sách nhóm.");
      setGroups([]);
      setInvitations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    dispatch(fetchUserProfile());

    const timer = window.setTimeout(() => {
      loadGroups();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [dispatch, loadGroups]);

  const openCreateModal = () => {
    setSelectedGroup(null);
    setForm(emptyGroupForm);
    setNotice("");
    setError("");
    setActiveModal("create");
  };

  const openEditModal = (group) => {
    setSelectedGroup(group);
    setForm({
      name: group?.name || "",
      description: group?.description || "",
      avatar: group?.avatar || "",
      isPrivate: !!group?.isPrivate,
      invitedUserIds: [],
    });
    setNotice("");
    setError("");
    setActiveModal("edit");
  };

  const openInviteModal = (group) => {
    setSelectedGroup(group);
    setForm({ ...emptyGroupForm, invitedUserIds: [] });
    setNotice("");
    setError("");
    setActiveModal("invite");
  };

  const openAdminModal = (group) => {
    setSelectedGroup(group);
    setForm({ ...emptyGroupForm, invitedUserIds: [] });
    setNotice("");
    setError("");
    setActiveModal("admin");
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedGroup(null);
    setForm(emptyGroupForm);
    setActionLoading(false);
  };

  const toggleFriendSelection = (friendId) => {
    setForm((current) => {
      const selected = current.invitedUserIds.includes(friendId);
      return {
        ...current,
        invitedUserIds: selected
          ? current.invitedUserIds.filter((id) => id !== friendId)
          : [...current.invitedUserIds, friendId],
      };
    });
  };

  const handleCreateGroup = async (event) => {
    event.preventDefault();
    if (actionLoading) return;

    setActionLoading(true);
    setError("");
    setNotice("");

    try {
      const response = await groupAPI.createGroup(form);
      setNotice(response.data?.message || "Tạo nhóm thành công.");
      closeModal();
      await loadGroups();
    } catch (err) {
      setError(err.response?.data?.message || "Không thể tạo nhóm.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateGroup = async (event) => {
    event.preventDefault();
    if (!selectedGroup || actionLoading) return;

    setActionLoading(true);
    setError("");
    setNotice("");

    try {
      const response = await groupAPI.updateGroupInfo(getId(selectedGroup), {
        name: form.name,
        description: form.description,
        avatar: form.avatar,
        isPrivate: form.isPrivate,
      });
      setNotice(response.data?.message || "Cập nhật nhóm thành công.");
      closeModal();
      await loadGroups();
    } catch (err) {
      setError(err.response?.data?.message || "Không thể cập nhật nhóm.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleInviteMembers = async (event) => {
    event.preventDefault();
    if (!selectedGroup || actionLoading || form.invitedUserIds.length === 0) return;

    setActionLoading(true);
    setError("");
    setNotice("");

    try {
      const response = await groupAPI.inviteToGroup(
        getId(selectedGroup),
        form.invitedUserIds,
      );
      setNotice(response.data?.message || "Đã gửi lời mời tham gia nhóm.");
      closeModal();
      await loadGroups();
    } catch (err) {
      setError(err.response?.data?.message || "Không thể gửi lời mời.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignAdmin = async (event) => {
    event.preventDefault();
    if (!selectedGroup || actionLoading || form.invitedUserIds.length === 0) return;

    setActionLoading(true);
    setError("");
    setNotice("");

    try {
      const response = await groupAPI.assignAdmin(
        getId(selectedGroup),
        form.invitedUserIds[0],
      );
      setNotice(response.data?.message || "Bổ nhiệm Admin thành công.");
      closeModal();
      await loadGroups();
    } catch (err) {
      setError(err.response?.data?.message || "Không thể bổ nhiệm Admin.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcceptInvitation = async (group) => {
    const groupId = getId(group);
    if (!groupId || inviteActionKey) return;

    setInviteActionKey(`accept-${groupId}`);
    setError("");
    setNotice("");

    try {
      const response = await groupAPI.acceptGroupInvitation(groupId);
      setNotice(response.data?.message || "Đã tham gia nhóm.");
      setInvitations((current) =>
        current.filter((item) => String(getId(item)) !== String(groupId)),
      );
      await loadGroups();
    } catch (err) {
      setError(err.response?.data?.message || "Không thể chấp nhận lời mời.");
    } finally {
      setInviteActionKey("");
    }
  };

  const handleRejectInvitation = async (group) => {
    const groupId = getId(group);
    if (!groupId || inviteActionKey) return;

    setInviteActionKey(`reject-${groupId}`);
    setError("");
    setNotice("");

    try {
      const response = await groupAPI.rejectGroupInvitation(groupId);
      setNotice(response.data?.message || "Đã từ chối lời mời.");
      setInvitations((current) =>
        current.filter((item) => String(getId(item)) !== String(groupId)),
      );
    } catch (err) {
      setError(err.response?.data?.message || "Không thể từ chối lời mời.");
    } finally {
      setInviteActionKey("");
    }
  };

  const currentUserId = String(profile?.userId || profile?._id || "");
  const stats = useMemo(() => {
    const adminGroups = groups.filter((group) =>
      (group.admins || []).some((adminId) => String(getId(adminId)) === currentUserId),
    ).length;

    return [
      { label: "Nhóm", value: groups.length },
      { label: "Quản trị", value: adminGroups },
    ];
  }, [currentUserId, groups]);

  return (
    <div className="min-h-screen bg-[#f2f3f5] text-[#111827]">
      <div className="min-h-screen w-full bg-white">
        <HomeHeader profile={profile} activePage="groups" />

        <main className="grid min-h-[calc(100vh-80px)] grid-cols-1 bg-[#f2f3f5] lg:grid-cols-[280px_minmax(0,1fr)_320px]">
          <LeftSidebar profile={profile} />

          <section className="space-y-5 px-5 py-5">
            <section className="rounded-lg bg-white p-7 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase text-[#1877f2]">
                    Cộng đồng
                  </p>
                  <h1 className="mt-1 text-2xl font-bold">Groups</h1>
                  <p className="mt-1 text-sm text-[#6b7280]">
                    Tạo nhóm nhỏ để học tập, trao đổi và mời bạn bè tham gia.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="grid grid-cols-2 gap-3">
                    {stats.map((item) => (
                      <div
                        key={item.label}
                        className="min-w-24 rounded-md bg-[#f2f3f5] px-4 py-3 text-center"
                      >
                        <div className="text-xl font-bold">{item.value}</div>
                        <div className="text-[10px] font-semibold uppercase text-[#6b7280]">
                          {item.label}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={openCreateModal}
                    className="rounded-md bg-[#1877f2] px-5 py-2 text-sm font-semibold text-white shadow-md hover:bg-[#166fe5]"
                  >
                    Tạo nhóm
                  </button>
                </div>
              </div>
            </section>

            {notice ? <StatusCard icon="info" message={notice} /> : null}
            {error ? <StatusCard icon="error" message={error} tone="error" /> : null}
            {loading ? <StatusCard icon="sync" message="Đang tải nhóm..." loading /> : null}

            {!loading && !error && invitations.length > 0 ? (
              <InvitationPanel
                invitations={invitations}
                actionKey={inviteActionKey}
                onAccept={handleAcceptInvitation}
                onReject={handleRejectInvitation}
              />
            ) : null}

            {!loading && !error && groups.length === 0 && invitations.length === 0 ? (
              <StatusCard
                icon="groups"
                message="Bạn chưa tham gia nhóm nào."
                detail="Tạo nhóm đầu tiên rồi mời bạn bè cùng vào nhé."
              />
            ) : null}

            {groups.length > 0 ? (
              <section className="rounded-lg bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-base font-bold">Nhóm của bạn</h2>
                  <span className="text-xs font-semibold text-[#6b7280]">
                    {groups.length} nhóm
                  </span>
                </div>

                <div className="grid gap-4 xl:grid-cols-2">
                  {groups.map((group) => (
                    <GroupCard
                      key={getId(group)}
                      group={group}
                      currentUserId={currentUserId}
                      onEdit={() => openEditModal(group)}
                      onInvite={() => openInviteModal(group)}
                      onAssignAdmin={() => openAdminModal(group)}
                    />
                  ))}
                </div>
              </section>
            ) : null}
          </section>

          <RightSidebar contacts={contacts} />
        </main>
      </div>

      {activeModal ? (
        <GroupModal
          mode={activeModal}
          group={selectedGroup}
          form={form}
          friends={friends}
          actionLoading={actionLoading}
          onChange={setForm}
          onToggleFriend={toggleFriendSelection}
          onClose={closeModal}
          onCreate={handleCreateGroup}
          onUpdate={handleUpdateGroup}
          onInvite={handleInviteMembers}
          onAssignAdmin={handleAssignAdmin}
        />
      ) : null}
    </div>
  );
};

const InvitationPanel = ({ invitations, actionKey, onAccept, onReject }) => (
  <section className="rounded-lg bg-white p-5 shadow-sm">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="text-xs font-semibold uppercase text-[#1877f2]">
          Lời mời vào nhóm
        </p>
        <h2 className="mt-1 text-base font-bold">
          {invitations.length} lời mời đang chờ
        </h2>
      </div>
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e7f3ff] text-[#1877f2]">
        <span className="material-symbols-outlined text-[22px]">mail</span>
      </span>
    </div>

    <div className="grid gap-4 xl:grid-cols-2">
      {invitations.map((group) => {
        const groupId = getId(group);
        const accepting = actionKey === `accept-${groupId}`;
        const rejecting = actionKey === `reject-${groupId}`;

        return (
          <article
            key={groupId}
            className="rounded-lg border border-[#e5e7eb] bg-[#f8fafc] p-4"
          >
            <div className="flex gap-4">
              <GroupAvatar group={group} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate text-base font-bold">{group.name}</h3>
                  <span className="rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-[#1877f2]">
                    {group.isPrivate ? "Riêng tư" : "Công khai"}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-[#6b7280]">
                  {group.description || "Bạn được mời tham gia nhóm này."}
                </p>
                <p className="mt-2 text-xs font-semibold text-[#6b7280]">
                  {group.creator?.fullName
                    ? `${group.creator.fullName} đã mời bạn`
                    : "Bạn có lời mời tham gia nhóm"}
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
                {accepting ? "Đang đồng ý..." : "Đồng ý"}
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
                {rejecting ? "Đang từ chối..." : "Từ chối"}
              </button>
            </div>
          </article>
        );
      })}
    </div>
  </section>
);

const GroupCard = ({
  group,
  currentUserId,
  onEdit,
  onInvite,
  onAssignAdmin,
}) => {
  const memberCount = group.members?.length || 0;
  const adminCount = group.admins?.length || 0;
  const isAdmin = (group.admins || []).some(
    (adminId) => String(getId(adminId)) === currentUserId,
  );

  return (
    <article className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-[#eef0f2] transition hover:-translate-y-0.5 hover:shadow-md">
      <Link
        to={`/groups/${getId(group)}`}
        className="flex items-start gap-4 rounded-md hover:bg-[#f8fafc]"
      >
        <GroupAvatar group={group} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-bold">{group.name}</h3>
            <span className="rounded-full bg-[#eef5ff] px-2 py-1 text-[11px] font-semibold text-[#1877f2]">
              {group.isPrivate ? "Riêng tư" : "Công khai"}
            </span>
          </div>
          <p className="mt-1 line-clamp-2 text-sm text-[#6b7280]">
            {group.description || "Chưa có mô tả nhóm."}
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-[#6b7280]">
            <span className="rounded bg-[#f2f3f5] px-3 py-1">
              {memberCount} thành viên
            </span>
            <span className="rounded bg-[#f2f3f5] px-3 py-1">
              {adminCount} admin
            </span>
            {isAdmin ? (
              <span className="rounded bg-[#e7f3ff] px-3 py-1 text-[#1877f2]">
                Bạn là admin
              </span>
            ) : null}
          </div>
        </div>
      </Link>

      {isAdmin ? (
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <button
            type="button"
            onClick={onEdit}
            className="flex items-center justify-center gap-1 rounded-md bg-[#f2f3f5] px-3 py-2 text-xs font-semibold hover:bg-[#e5e7eb]"
          >
            <span className="material-symbols-outlined text-[15px]">edit</span>
            Chỉnh sửa
          </button>
          <button
            type="button"
            onClick={onInvite}
            className="flex items-center justify-center gap-1 rounded-md bg-[#1877f2] px-3 py-2 text-xs font-semibold text-white hover:bg-[#166fe5]"
          >
            <span className="material-symbols-outlined text-[15px]">person_add</span>
            Mời bạn bè
          </button>
          <button
            type="button"
            onClick={onAssignAdmin}
            className="flex items-center justify-center gap-1 rounded-md bg-[#e7f3ff] px-3 py-2 text-xs font-semibold text-[#1877f2] hover:bg-[#dbeafe]"
          >
            <span className="material-symbols-outlined text-[15px]">admin_panel_settings</span>
            Thêm admin
          </button>
        </div>
      ) : null}
    </article>
  );
};

const GroupAvatar = ({ group }) => (
  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md bg-[#dbeafe] text-xl font-bold text-[#1877f2]">
    {group.avatar ? (
      <img className="h-full w-full object-cover" src={group.avatar} alt={group.name} />
    ) : (
      <span className="material-symbols-outlined text-[30px]">groups</span>
    )}
  </div>
);

const GroupModal = ({
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
  const memberIds = (group?.members || []).map((member) => String(getId(member)));
  const adminIds = (group?.admins || []).map((admin) => String(getId(admin)));
  const assignableMembers = (group?.members || [])
    .map((member) => ({
      id: getId(member),
      fullName: member?.fullName || member?.name || "Thành viên nhóm",
      avatar: member?.avatar || member?.image || null,
    }))
    .filter((member) => member.id);
  const title = isCreate
    ? "Tạo nhóm"
    : isEdit
      ? "Chỉnh sửa nhóm"
      : isInvite
        ? "Mời bạn bè"
        : "Bổ nhiệm Admin";
  const submitLabel = actionLoading
    ? "Đang lưu..."
    : isCreate
      ? "Tạo nhóm"
      : isEdit
        ? "Lưu thay đổi"
        : isInvite
          ? "Gửi lời mời"
          : "Bổ nhiệm";
  const submitHandler = isCreate
    ? onCreate
    : isEdit
      ? onUpdate
      : isInvite
        ? onInvite
        : onAssignAdmin;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 px-4 py-8">
      <form
        onSubmit={submitHandler}
        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-lg bg-white p-5 shadow-2xl"
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
            aria-label="Đóng"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {isCreate || isEdit ? (
          <div className="space-y-4">
            <Field label="Tên nhóm">
              <input
                value={form.name}
                onChange={(event) =>
                  onChange((current) => ({ ...current, name: event.target.value }))
                }
                className="h-11 w-full rounded-md border border-[#dddfe2] px-3 text-sm outline-none focus:border-[#1877f2]"
                placeholder="Ví dụ: Nhóm học Công nghệ phần mềm"
                required
              />
            </Field>

            <Field label="Mô tả">
              <textarea
                value={form.description}
                onChange={(event) =>
                  onChange((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                className="min-h-24 w-full resize-none rounded-md border border-[#dddfe2] px-3 py-2 text-sm outline-none focus:border-[#1877f2]"
                placeholder="Nhóm này dùng để trao đổi..."
              />
            </Field>

            <Field label="Ảnh đại diện nhóm">
              <input
                value={form.avatar}
                onChange={(event) =>
                  onChange((current) => ({ ...current, avatar: event.target.value }))
                }
                className="h-11 w-full rounded-md border border-[#dddfe2] px-3 text-sm outline-none focus:border-[#1877f2]"
                placeholder="https://..."
              />
            </Field>

            <label className="flex items-center justify-between rounded-md bg-[#f2f3f5] px-4 py-3">
              <span>
                <span className="block text-sm font-semibold">Nhóm riêng tư</span>
                <span className="text-xs text-[#6b7280]">
                  Thành viên cần được mời hoặc duyệt trước khi tham gia.
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
        ) : null}

        {isCreate || isInvite || mode === "admin" ? (
          <FriendPicker
            friends={mode === "admin" ? assignableMembers : friends}
            selectedIds={form.invitedUserIds}
            single={mode === "admin"}
            disabledIds={isInvite ? memberIds : mode === "admin" ? adminIds : []}
            disabledReasonType={mode}
            disabledLabel="Đã trong nhóm"
            onToggleFriend={onToggleFriend}
          />
        ) : null}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-[#e5e7eb] px-5 py-2 text-sm font-semibold hover:bg-[#d1d5db]"
          >
            Hủy
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

const FriendPicker = ({
  friends,
  selectedIds,
  single = false,
  disabledIds = [],
  disabledReasonType = "",
  disabledLabel = "Không thể chọn",
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
        {single ? "Chọn thành viên" : "Mời bạn bè"}
      </h3>
      <span className="text-xs font-semibold text-[#6b7280]">
        {selectedIds.length} đã chọn
      </span>
    </div>

    {friends.length === 0 ? (
      <div className="rounded-md bg-[#f2f3f5] p-4 text-center text-sm font-semibold text-[#6b7280]">
        Chưa có bạn bè để chọn.
      </div>
    ) : (
      <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
        {friends.map((friend) => {
          const disabled = disabledIdSet.has(String(friend.id));
          const selected = selectedIds.includes(friend.id);
          const disabledText = disabledReasonType === "admin"
            ? "Đã là admin"
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

const Field = ({ label, children }) => (
  <label className="block">
    <span className="mb-2 block text-sm font-semibold">{label}</span>
    {children}
  </label>
);

const StatusCard = ({ icon, message, detail, tone = "neutral", loading }) => (
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

export default Groups;

import { useCallback, useEffect, useMemo, useState } from "react";
import HomeHeader from "../../components/home/HomeHeader";
import LeftSidebar from "../../components/home/LeftSidebar";
import RightSidebar from "../../components/home/RightSidebar";
import {
  GroupCard,
  GroupModal,
  InvitationPanel,
  StatusCard,
} from "../../components/groups/GroupListComponents";
import { useProfileFriends } from "../../hooks";
import { groupAPI } from "../../services/api";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { fetchUserProfile } from "../../redux/slices/userSlice";
import Toast from "../../components/common/Toast";

const getId = (item) => item?._id || item?.id || item?.userId || item || "";

const emptyGroupForm = {
  name: "",
  description: "",
  avatar: "",
  avatarFile: null,
  avatarPreview: "",
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

  const { friends, contacts } = useProfileFriends(profile, "Friends");

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
      setError(err.response?.data?.message || "Unable to load groups.");
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
      avatarFile: null,
      avatarPreview: "",
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
      setNotice(response.data?.message || "Group created successfully.");
      closeModal();
      await loadGroups();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to create group.");
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
        avatarFile: form.avatarFile,
        isPrivate: form.isPrivate,
      });
      setNotice(response.data?.message || "Group updated successfully.");
      closeModal();
      await loadGroups();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to update group.");
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
      setNotice(response.data?.message || "Group invitation sent.");
      closeModal();
      await loadGroups();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to send invitation.");
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
      setNotice(response.data?.message || "Admin assigned successfully.");
      closeModal();
      await loadGroups();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to assign admin.");
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
      setNotice(response.data?.message || "Joined group.");
      setInvitations((current) =>
        current.filter((item) => String(getId(item)) !== String(groupId)),
      );
      await loadGroups();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to accept invitation.");
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
      setNotice(response.data?.message || "Invitation rejected.");
      setInvitations((current) =>
        current.filter((item) => String(getId(item)) !== String(groupId)),
      );
    } catch (err) {
      setError(err.response?.data?.message || "Unable to reject invitation.");
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
      { label: "Groups", value: groups.length },
      { label: "Managed", value: adminGroups },
    ];
  }, [currentUserId, groups]);

  return (
    <div className="min-h-screen bg-[#f2f3f5] text-[#111827]">
      <div className="min-h-screen w-full bg-white">
        <HomeHeader profile={profile} activePage="groups" />

        <main className="grid min-h-[calc(100vh-80px)] grid-cols-1 justify-center bg-[#f2f3f5] lg:grid-cols-[240px_minmax(0,780px)] xl:grid-cols-[260px_minmax(0,820px)_300px] 2xl:grid-cols-[280px_minmax(0,920px)_320px]">
          <LeftSidebar profile={profile} />

          <section className="min-w-0 space-y-4 px-3 py-3 sm:px-4 sm:py-4 lg:space-y-5 lg:px-5 lg:py-5">
            <section className="rounded-lg bg-white p-4 shadow-sm sm:p-5 lg:p-7">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase text-[#1877f2]">
                    Community
                  </p>
                  <h1 className="mt-1 text-2xl font-bold">Groups</h1>
                  <p className="mt-1 text-sm text-[#6b7280]">
                    Create small groups to study, discuss, and invite friends.
                  </p>
                </div>

                <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
                  <div className="grid grid-cols-2 gap-3 sm:w-auto">
                    {stats.map((item) => (
                      <div
                        key={item.label}
                        className="min-w-0 rounded-md bg-[#f2f3f5] px-4 py-3 text-center sm:min-w-24"
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
                    className="w-full rounded-md bg-[#1877f2] px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-[#166fe5] sm:w-auto"
                  >
                    Create group
                  </button>
                </div>
              </div>
            </section>

            {error ? <StatusCard icon="error" message={error} tone="error" /> : null}
            {loading ? <StatusCard icon="sync" message="Loading groups..." loading /> : null}

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
                message="You have not joined any groups yet."
                detail="Create your first group and invite friends to join."
              />
            ) : null}

            {groups.length > 0 ? (
              <section className="rounded-lg bg-white p-4 shadow-sm sm:p-5">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-base font-bold">Your groups</h2>
                  <span className="text-xs font-semibold text-[#6b7280]">
                    {groups.length} groups
                  </span>
                </div>

                <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
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

      {notice ? (
        <Toast
          message={notice}
          type="success"
          onClose={() => setNotice("")}
        />
      ) : null}
    </div>
  );
};

export default Groups;



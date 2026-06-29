import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Composer from "../../components/home/Composer";
import HomeHeader from "../../components/home/HomeHeader";
import LeftSidebar from "../../components/home/LeftSidebar";
import RightSidebar from "../../components/home/RightSidebar";
import {
  EditGroupModal,
  GroupHero,
  InfoPanel,
  ManageListPanel,
  PendingGroupPostsPanel,
  StatusCard as GroupStatusCard,
  SummaryPanel,
} from "../../components/groups/GroupDetailComponents";
import StatusCard from "../../components/common/StatusCard";
import { PostList } from "../../components/post";
import { useHomeSidebar } from "../../hooks";
import { groupAPI } from "../../services/api";
import { postAPI } from "../../services/post.service";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { fetchUserProfile } from "../../redux/slices/userSlice";
import Toast from "../../components/common/Toast";

const getId = (item) => item?._id || item?.id || item?.userId || item || "";
const shouldShowLegacyInfoPanel = false;

const GroupDetail = () => {
  const { groupId } = useParams();
  const dispatch = useAppDispatch();
  const { profile } = useAppSelector((state) => state.user);
  const [group, setGroup] = useState(null);
  const [activeList, setActiveList] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    avatar: "",
    avatarFile: null,
    avatarPreview: "",
    isPrivate: false,
  });
  const [loading, setLoading] = useState(false);
  const [actionKey, setActionKey] = useState("");
  const [postActionKey, setPostActionKey] = useState("");
  const [postRefreshKey, setPostRefreshKey] = useState(0);
  const [pendingPosts, setPendingPosts] = useState([]);
  const [pendingPostsLoading, setPendingPostsLoading] = useState(false);
  const [savingGroup, setSavingGroup] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const {
    contacts,
    friendRequests,
    groupConversations,
    groupsLoading,
    handleAcceptRequest,
    handleContactClick,
    handleGroupClick,
    handleRejectRequest,
    requestActionId,
    requestsLoading,
  } = useHomeSidebar({ dispatch, profile });

  const loadGroup = useCallback(async () => {
    if (!groupId) return;

    setLoading(true);
    setError("");

    try {
      const response = await groupAPI.getGroupDetail(groupId);
      setGroup(response.data?.data || null);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load group details.");
      setGroup(null);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    dispatch(fetchUserProfile());

    const timer = window.setTimeout(() => {
      loadGroup();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [dispatch, loadGroup]);

  const admins = useMemo(() => group?.admins || [], [group?.admins]);
  const members = useMemo(() => group?.members || [], [group?.members]);
  const pendingInvites = useMemo(
    () => group?.pendingInvites || [],
    [group?.pendingInvites],
  );
  const pendingRequests = useMemo(
    () => group?.pendingRequests || [],
    [group?.pendingRequests],
  );
  const currentUserId = String(profile?.userId || profile?._id || "");

  const listData = useMemo(
    () => ({
      members,
      admins,
      invites: pendingInvites,
      requests: pendingRequests,
      creator: group?.creator ? [group.creator] : [],
      privacy: [],
    }),
    [admins, group, members, pendingInvites, pendingRequests],
  );

  const counts = useMemo(
    () => ({
      members: members.length,
      admins: admins.length,
      invites: group?.isCurrentUserAdmin ? pendingInvites.length : "-",
      requests: group?.isCurrentUserAdmin ? pendingRequests.length : "-",
      creator: group?.creator ? 1 : 0,
      privacy: group?.isPrivate ? "Private" : "Public",
    }),
    [
      admins.length,
      group?.creator,
      group?.isCurrentUserAdmin,
      group?.isPrivate,
      members.length,
      pendingInvites.length,
      pendingRequests.length,
    ],
  );

  const loadPendingPosts = useCallback(async () => {
    if (!groupId || !group?.isCurrentUserAdmin) {
      setPendingPosts([]);
      return;
    }

    setPendingPostsLoading(true);

    try {
      const response = await postAPI.getPendingGroupPosts(groupId, 1, 10);
      setPendingPosts(response.data?.data?.posts || []);
    } catch (err) {
      setPendingPosts([]);
      setError(err.response?.data?.message || "Unable to load pending posts.");
    } finally {
      setPendingPostsLoading(false);
    }
  }, [group?.isCurrentUserAdmin, groupId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadPendingPosts();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [group?.isCurrentUserAdmin, loadPendingPosts, postRefreshKey]);

  const refreshAfterAction = async (message) => {
    setNotice(message);
    await loadGroup();
  };

  const handleSelectManagedSection = (key) => {
    setActiveList((current) => (current === key ? null : key));
  };

  const handleUpdatePrivacy = async (isPrivate) => {
    if (!group || actionKey) return;

    setActionKey("privacy");
    setNotice("");
    setError("");

    try {
      const response = await groupAPI.updateGroupInfo(getId(group), { isPrivate });
      setGroup((current) =>
        current
          ? {
              ...current,
              isPrivate,
            }
          : current,
      );
      setNotice(response.data?.message || "Group privacy updated.");
      await loadGroup();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to update group privacy.");
    } finally {
      setActionKey("");
    }
  };

  const handleGroupPostCreated = () => {
    setPostRefreshKey((current) => current + 1);
    setNotice(
      group?.isCurrentUserAdmin
        ? "Posted to the group."
        : "Your post was submitted and is waiting for admin approval.",
    );
  };

  const handleApprovePost = async (post) => {
    const postId = getId(post);
    if (!postId || postActionKey) return;

    setPostActionKey(`approve-post-${postId}`);
    setNotice("");
    setError("");

    try {
      const response = await postAPI.approveGroupPost(postId);
      setPendingPosts((current) =>
        current.filter((item) => String(getId(item)) !== String(postId)),
      );
      setPostRefreshKey((current) => current + 1);
      setNotice(response.data?.message || "Post approved.");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to approve post.");
    } finally {
      setPostActionKey("");
    }
  };

  const handleRejectPost = async (post) => {
    const postId = getId(post);
    if (!postId || postActionKey) return;

    setPostActionKey(`reject-post-${postId}`);
    setNotice("");
    setError("");

    try {
      const response = await postAPI.rejectGroupPost(postId);
      setPendingPosts((current) =>
        current.filter((item) => String(getId(item)) !== String(postId)),
      );
      setNotice(response.data?.message || "Post rejected.");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to reject post.");
    } finally {
      setPostActionKey("");
    }
  };

  const openEditModal = () => {
    if (!group) return;

    setEditForm({
      name: group.name || "",
      description: group.description || "",
      avatar: group.avatar || "",
      avatarFile: null,
      avatarPreview: "",
      isPrivate: !!group.isPrivate,
    });
    setNotice("");
    setError("");
    setIsEditModalOpen(true);
  };

  const handleUpdateGroup = async (event) => {
    event.preventDefault();
    if (!group || savingGroup) return;

    setSavingGroup(true);
    setNotice("");
    setError("");

    try {
      const response = await groupAPI.updateGroupInfo(getId(group), {
        name: editForm.name,
        description: editForm.description,
        avatarFile: editForm.avatarFile,
        isPrivate: editForm.isPrivate,
      });
      setIsEditModalOpen(false);
      await refreshAfterAction(response.data?.message || "Group updated.");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to update group.");
    } finally {
      setSavingGroup(false);
    }
  };

  const handleApproveRequest = async (person) => {
    const personId = getId(person);
    if (!group || !personId || actionKey) return;

    setActionKey(`approve-${personId}`);
    setNotice("");
    setError("");

    try {
      const response = await groupAPI.approveJoinRequest(getId(group), personId);
      await refreshAfterAction(response.data?.message || "Join request accepted.");
      setActiveList("members");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to accept request.");
    } finally {
      setActionKey("");
    }
  };

  const handleAcceptInvitation = async () => {
    if (!group || actionKey) return;

    setActionKey("accept-invite");
    setNotice("");
    setError("");

    try {
      const response = await groupAPI.acceptGroupInvitation(getId(group));
      setGroup((current) => {
        if (!current) return current;
        const currentId = String(currentUserId);

        return {
          ...current,
          isCurrentUserMember: true,
          hasPendingInvite: false,
          members: [
            ...(current.members || []),
            {
              _id: currentUserId,
              fullName: profile?.fullName || "You",
              avatar: profile?.avatar || null,
              isOnline: true,
            },
          ].filter(
            (member, index, list) =>
              list.findIndex((item) => String(getId(item)) === String(getId(member))) === index,
          ),
          pendingInvites: (current.pendingInvites || []).filter(
            (person) => String(getId(person)) !== currentId,
          ),
        };
      });
      setActiveList("members");
      setNotice(response.data?.message || "Group invitation accepted.");
      await loadGroup();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to accept invitation.");
    } finally {
      setActionKey("");
    }
  };

  const handleRequestJoinGroup = async () => {
    if (!group || actionKey) return;

    setActionKey("request-join");
    setNotice("");
    setError("");

    try {
      const response = await groupAPI.requestJoinGroup(getId(group));
      setGroup((current) => {
        if (!current) return current;

        return {
          ...current,
          hasPendingRequest: true,
          pendingRequests: [
            ...(current.pendingRequests || []),
            {
              _id: currentUserId,
              fullName: profile?.fullName || "You",
              avatar: profile?.avatar || null,
              isOnline: true,
            },
          ].filter(
            (person, index, list) =>
              list.findIndex((item) => String(getId(item)) === String(getId(person))) === index,
          ),
        };
      });
      setNotice(response.data?.message || "Join request sent.");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to send join request.");
    } finally {
      setActionKey("");
    }
  };

  const handleAssignAdmin = async (person) => {
    const personId = getId(person);
    if (!group || !personId || actionKey) return;

    setActionKey(`admin-${personId}`);
    setNotice("");
    setError("");

    try {
      const response = await groupAPI.assignAdmin(getId(group), personId);
      await refreshAfterAction(response.data?.message || "New admin added.");
      setActiveList("admins");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to add admin.");
    } finally {
      setActionKey("");
    }
  };

  const handleCancelInvitation = async (person) => {
    const personId = getId(person);
    if (!group || !personId || actionKey) return;

    setActionKey(`cancel-invite-${personId}`);
    setNotice("");
    setError("");

    try {
      const response = await groupAPI.cancelInvitation(getId(group), personId);
      await refreshAfterAction(response.data?.message || "Invitation cancelled.");
      setActiveList("invites");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to cancel invitation.");
    } finally {
      setActionKey("");
    }
  };

  const handleRemoveMember = async (person) => {
    const personId = getId(person);
    if (!group || !personId || actionKey) return;

    setActionKey(`remove-member-${personId}`);
    setNotice("");
    setError("");

    try {
      const response = await groupAPI.removeMember(getId(group), personId);
      await refreshAfterAction(response.data?.message || "Member removed from group.");
      setActiveList("members");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to remove member.");
    } finally {
      setActionKey("");
    }
  };

  const isAdminPerson = (person) =>
    admins.some((admin) => String(getId(admin)) === String(getId(person)));

  return (
    <div className="min-h-screen bg-[#f2f3f5] text-[#111827]">
      <div className="min-h-screen w-full bg-white">
        <HomeHeader profile={profile} activePage="groups" />

        <main className="grid min-h-[calc(100vh-80px)] grid-cols-1 justify-center bg-[#f2f3f5] lg:grid-cols-[240px_minmax(0,780px)] xl:grid-cols-[260px_minmax(0,820px)_300px] 2xl:grid-cols-[280px_minmax(0,920px)_320px]">
          <LeftSidebar profile={profile} />

          <section className="min-w-0 space-y-4 px-3 py-3 sm:px-4 sm:py-4 lg:space-y-5 lg:px-5 lg:py-5">
            <Link
              to="/groups"
              className="inline-flex items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-semibold text-[#1877f2] shadow-sm hover:bg-[#f8fafc]"
            >
              <span className="material-symbols-outlined text-[18px]">
                arrow_back
              </span>
              Back to Groups
            </Link>

            {loading ? (
              <StatusCard
                icon="sync"
                message="Loading group details..."
                loading
                layout="inline"
              />
            ) : null}

            {error ? (
              <StatusCard icon="error" message={error} tone="error" layout="inline" />
            ) : null}

            {!loading && !error && group ? (
              <>
                <GroupHero
                  group={group}
                  accepting={actionKey === "accept-invite"}
                  requesting={actionKey === "request-join"}
                  onAcceptInvite={handleAcceptInvitation}
                  onRequestJoin={handleRequestJoinGroup}
                  onEdit={openEditModal}
                />

                <section className="space-y-4 lg:space-y-5">
                  <div className="space-y-5">
                    <SummaryPanel
                      activeList={activeList}
                      counts={counts}
                      isCurrentUserAdmin={group.isCurrentUserAdmin}
                      onSelect={handleSelectManagedSection}
                    />
                    {shouldShowLegacyInfoPanel ? <InfoPanel group={group} /> : null}

                    {activeList ? (
                      <ManageListPanel
                        activeList={activeList}
                        people={listData[activeList] || []}
                        group={group}
                        currentUserId={currentUserId}
                        actionKey={actionKey}
                        isAdminPerson={isAdminPerson}
                        onApproveRequest={handleApproveRequest}
                        onAssignAdmin={handleAssignAdmin}
                        onCancelInvitation={handleCancelInvitation}
                        onRemoveMember={handleRemoveMember}
                        onUpdatePrivacy={handleUpdatePrivacy}
                      />
                    ) : null}

                    {group.isCurrentUserMember || group.isCurrentUserAdmin ? (
                      <>
                        <Composer
                          profile={profile}
                          groupId={getId(group)}
                          groupName={group.name}
                          requiresApproval={!group.isCurrentUserAdmin}
                          onPostCreated={handleGroupPostCreated}
                        />

                        {group.isCurrentUserAdmin ? (
                          <PendingGroupPostsPanel
                            posts={pendingPosts}
                            loading={pendingPostsLoading}
                            actionKey={postActionKey}
                            onApprove={handleApprovePost}
                            onReject={handleRejectPost}
                          />
                        ) : null}

                        <PostList
                          groupId={getId(group)}
                          refreshKey={postRefreshKey}
                          emptyMessage="No posts in this group yet"
                          emptyDetail="Share something with the group."
                        />
                      </>
                    ) : (
                      <GroupStatusCard
                        icon="lock"
                        message="Join the group to view and create posts."
                      />
                    )}
                  </div>

                </section>
              </>
            ) : null}
          </section>

          <RightSidebar
            contacts={contacts}
            friendRequests={friendRequests}
            groupConversations={groupConversations}
            groupsLoading={groupsLoading}
            requestsLoading={requestsLoading}
            requestActionId={requestActionId}
            onAcceptRequest={handleAcceptRequest}
            onRejectRequest={handleRejectRequest}
            onContactClick={handleContactClick}
            onGroupClick={handleGroupClick}
          />
        </main>
      </div>

      {isEditModalOpen ? (
        <EditGroupModal
          form={editForm}
          saving={savingGroup}
          onChange={setEditForm}
          onClose={() => setIsEditModalOpen(false)}
          onSubmit={handleUpdateGroup}
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

export default GroupDetail;



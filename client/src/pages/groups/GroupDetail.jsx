import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { UserAvatar } from "../../components/common";
import Composer from "../../components/home/Composer";
import HomeHeader from "../../components/home/HomeHeader";
import LeftSidebar from "../../components/home/LeftSidebar";
import RightSidebar from "../../components/home/RightSidebar";
import { PostList } from "../../components/post";
import { groupAPI } from "../../services/api";
import { postAPI } from "../../services/post.service";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { fetchUserProfile } from "../../redux/slices/userSlice";

const getId = (item) => item?._id || item?.id || item?.userId || item || "";
const shouldShowLegacyInfoPanel = false;

const listConfigs = {
  members: {
    icon: "groups",
    label: "Thành viên",
    emptyText: "Nhóm chưa có thành viên.",
  },
  admins: {
    icon: "admin_panel_settings",
    label: "Admin",
    emptyText: "Nhóm chưa có admin.",
  },
  invites: {
    icon: "mail",
    label: "Lời mời chờ",
    emptyText: "Chưa có lời mời nào đang chờ.",
  },
  requests: {
    icon: "how_to_reg",
    label: "Yêu cầu chờ",
    emptyText: "Chưa có yêu cầu tham gia nào.",
  },
  creator: {
    icon: "person",
    label: "Người tạo",
    emptyText: "Không rõ người tạo nhóm.",
  },
  privacy: {
    icon: "public",
    label: "Quyền riêng tư",
    emptyText: "",
  },
};

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

  const friends = useMemo(() => {
    if (!Array.isArray(profile?.friends)) return [];

    return profile.friends.map((friend) => ({
      id: getId(friend),
      name: friend?.fullName || friend?.name || "Friend",
      avatar: friend?.avatar || friend?.image || null,
      status: friend?.isOnline ? "Online" : "View profile",
      online: friend?.isOnline || false,
    }));
  }, [profile]);

  const loadGroup = useCallback(async () => {
    if (!groupId) return;

    setLoading(true);
    setError("");

    try {
      const response = await groupAPI.getGroupDetail(groupId);
      setGroup(response.data?.data || null);
    } catch (err) {
      setError(err.response?.data?.message || "Không thể tải chi tiết nhóm.");
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
      privacy: group?.isPrivate ? "Riêng tư" : "Công khai",
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
      setError(err.response?.data?.message || "Không thể tải bài viết chờ duyệt.");
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
      setNotice(response.data?.message || "Đã cập nhật quyền riêng tư nhóm.");
      await loadGroup();
    } catch (err) {
      setError(err.response?.data?.message || "Không thể cập nhật quyền riêng tư nhóm.");
    } finally {
      setActionKey("");
    }
  };

  const handleGroupPostCreated = () => {
    setPostRefreshKey((current) => current + 1);
    setNotice(
      group?.isCurrentUserAdmin
        ? "Đã đăng bài trong nhóm."
        : "Bài viết đã được gửi và đang chờ admin duyệt.",
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
      setNotice(response.data?.message || "Đã duyệt bài viết.");
    } catch (err) {
      setError(err.response?.data?.message || "Không thể duyệt bài viết.");
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
      setNotice(response.data?.message || "Đã từ chối bài viết.");
    } catch (err) {
      setError(err.response?.data?.message || "Không thể từ chối bài viết.");
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
      const response = await groupAPI.updateGroupInfo(getId(group), editForm);
      setIsEditModalOpen(false);
      await refreshAfterAction(response.data?.message || "Đã cập nhật nhóm.");
    } catch (err) {
      setError(err.response?.data?.message || "Không thể cập nhật nhóm.");
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
      await refreshAfterAction(response.data?.message || "Đã chấp nhận yêu cầu tham gia.");
      setActiveList("members");
    } catch (err) {
      setError(err.response?.data?.message || "Không thể chấp nhận yêu cầu.");
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
              fullName: profile?.fullName || "Bạn",
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
      setNotice(response.data?.message || "Đã chấp nhận lời mời tham gia nhóm.");
      await loadGroup();
    } catch (err) {
      setError(err.response?.data?.message || "Không thể chấp nhận lời mời.");
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
              fullName: profile?.fullName || "Bạn",
              avatar: profile?.avatar || null,
              isOnline: true,
            },
          ].filter(
            (person, index, list) =>
              list.findIndex((item) => String(getId(item)) === String(getId(person))) === index,
          ),
        };
      });
      setNotice(response.data?.message || "Đã gửi yêu cầu tham gia nhóm.");
    } catch (err) {
      setError(err.response?.data?.message || "Không thể gửi yêu cầu tham gia nhóm.");
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
      await refreshAfterAction(response.data?.message || "Đã thêm admin mới.");
      setActiveList("admins");
    } catch (err) {
      setError(err.response?.data?.message || "Không thể thêm admin.");
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
      await refreshAfterAction(response.data?.message || "Đã xóa lời mời.");
      setActiveList("invites");
    } catch (err) {
      setError(err.response?.data?.message || "Không thể xóa lời mời.");
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
      await refreshAfterAction(response.data?.message || "Đã xóa thành viên khỏi nhóm.");
      setActiveList("members");
    } catch (err) {
      setError(err.response?.data?.message || "Không thể xóa thành viên.");
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

        <main className="grid min-h-[calc(100vh-80px)] grid-cols-1 bg-[#f2f3f5] lg:grid-cols-[280px_minmax(0,1fr)_320px]">
          <LeftSidebar profile={profile} />

          <section className="space-y-5 px-5 py-5">
            <Link
              to="/groups"
              className="inline-flex items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-semibold text-[#1877f2] shadow-sm hover:bg-[#f8fafc]"
            >
              <span className="material-symbols-outlined text-[18px]">
                arrow_back
              </span>
              Quay lại Groups
            </Link>

            {loading ? (
              <StatusCard icon="sync" message="Đang tải chi tiết nhóm..." loading />
            ) : null}

            {error ? (
              <StatusCard icon="error" message={error} tone="error" />
            ) : null}

            {notice ? (
              <StatusCard icon="info" message={notice} />
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

                <section className="space-y-5">
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
                          emptyMessage="Chưa có bài viết nào trong nhóm"
                          emptyDetail="Hãy chia sẻ điều gì đó với nhóm."
                        />
                      </>
                    ) : (
                      <StatusCard
                        icon="lock"
                        message="Tham gia nhóm để xem và đăng bài viết."
                      />
                    )}
                  </div>

                </section>
              </>
            ) : null}
          </section>

          <RightSidebar contacts={friends} />
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
    </div>
  );
};

const GroupHero = ({
  group,
  accepting,
  requesting,
  onAcceptInvite,
  onRequestJoin,
  onEdit,
}) => (
  <section className="overflow-hidden rounded-lg bg-white shadow-sm">
    <div className="relative h-52 bg-gradient-to-br from-[#e8f1ff] via-[#cfe1ff] to-[#9fc5ff] sm:h-60">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.18),rgba(15,23,42,0.08))]" />
      <div className="absolute bottom-5 right-6 hidden items-center gap-2 rounded-md bg-white/90 px-4 py-2 text-sm font-semibold text-[#111827] shadow-sm sm:flex">
        <span className="material-symbols-outlined text-[18px]">
          collections_bookmark
        </span>
        Group profile
      </div>
    </div>

    <div className="px-5 pb-7 sm:px-8">
      <div className="relative -mt-16 flex flex-wrap items-end justify-between gap-4">
        <div className="flex min-w-0 flex-wrap items-end gap-5">
          <div className="h-32 w-32 overflow-hidden rounded-full border-4 border-white bg-[#dbeafe] text-[#1877f2] shadow-md sm:h-36 sm:w-36">
            {group.avatar ? (
              <img
                className="h-full w-full object-cover"
                src={group.avatar}
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

          <div className="mb-3 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-3xl font-bold text-[#111827]">
                {group.name}
              </h1>
              <span className="rounded-full bg-[#eef5ff] px-3 py-1 text-xs font-semibold text-[#1877f2]">
                {group.isPrivate ? "Riêng tư" : "Công khai"}
              </span>
            </div>
            <p className="mt-2 text-sm text-[#6b7280]">
              {group.members?.length || 0} thành viên
              {group.isCurrentUserAdmin ? " · Bạn là admin" : ""}
            </p>
          </div>
        </div>

        {group.description ? (
          <p className="mb-3 max-w-2xl text-sm leading-6 text-[#4b5563]">
            {group.description}
          </p>
        ) : null}

        <div className="mb-3 flex flex-wrap gap-2">
          {group.hasPendingInvite && !group.isCurrentUserMember ? (
            <button
              type="button"
              onClick={onAcceptInvite}
              disabled={accepting}
              className="flex items-center gap-2 rounded-md bg-[#1877f2] px-5 py-2 text-sm font-semibold text-white hover:bg-[#166fe5] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-[18px]">
                how_to_reg
              </span>
              {accepting ? "Đang tham gia..." : "Chấp nhận lời mời"}
            </button>
          ) : null}

          {!group.isCurrentUserMember && !group.isCurrentUserAdmin && !group.hasPendingInvite ? (
            group.hasPendingRequest ? (
              <button
                type="button"
                disabled
                className="flex cursor-not-allowed items-center gap-2 rounded-md bg-[#e5e7eb] px-5 py-2 text-sm font-semibold text-[#6b7280]"
              >
                <span className="material-symbols-outlined text-[18px]">
                  pending
                </span>
                Đang chờ duyệt
              </button>
            ) : (
              <button
                type="button"
                onClick={onRequestJoin}
                disabled={requesting}
                className="flex items-center gap-2 rounded-md bg-[#1877f2] px-5 py-2 text-sm font-semibold text-white hover:bg-[#166fe5] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="material-symbols-outlined text-[18px]">
                  group_add
                </span>
                {requesting ? "Đang gửi..." : "Xin vào nhóm"}
              </button>
            )
          ) : null}

          {group.isCurrentUserAdmin ? (
            <button
              type="button"
              onClick={onEdit}
              className="flex items-center gap-2 rounded-md bg-[#e7f3ff] px-5 py-2 text-sm font-semibold text-[#1877f2] hover:bg-[#dbeafe]"
            >
              <span className="material-symbols-outlined text-[18px]">
                edit
              </span>
              Chỉnh sửa nhóm
            </button>
          ) : null}
        </div>
      </div>

      {group.hasPendingInvite && !group.isCurrentUserMember ? (
        <div className="mt-4 rounded-md bg-[#e7f3ff] px-4 py-3 text-sm font-semibold text-[#1877f2]">
          Bạn có lời mời tham gia nhóm này. Chấp nhận để nhóm được thêm vào danh sách của bạn.
        </div>
      ) : null}
      {group.hasPendingRequest && !group.isCurrentUserMember ? (
        <div className="mt-4 rounded-md bg-[#fff7ed] px-4 py-3 text-sm font-semibold text-[#c2410c]">
          Yêu cầu tham gia nhóm của bạn đang chờ admin duyệt.
        </div>
      ) : null}
    </div>
  </section>
);

const InfoPanel = ({ group }) => (
  <section className="rounded bg-white p-5 shadow-sm">
    <h2 className="text-base font-bold">Giới thiệu</h2>
    <p className="mt-3 text-sm leading-6 text-[#4b5563]">
      {group.description || "Nhóm này chưa có mô tả."}
    </p>

    <div className="mt-5 grid gap-3 sm:grid-cols-2">
      <InfoItem
        icon={group.isPrivate ? "lock" : "public"}
        label="Quyền riêng tư"
        value={group.isPrivate ? "Nhóm riêng tư" : "Nhóm công khai"}
      />
      <InfoItem
        icon="person"
        label="Người tạo"
        value={group.creator?.fullName || "Không rõ"}
      />
      <InfoItem
        icon="admin_panel_settings"
        label="Admin"
        value={`${group.admins?.length || 0} người`}
      />
      <InfoItem
        icon="groups"
        label="Thành viên"
        value={`${group.members?.length || 0} người`}
      />
    </div>
  </section>
);

const PendingGroupPostsPanel = ({
  posts,
  loading,
  actionKey,
  onApprove,
  onReject,
}) => (
  <section className="rounded bg-white p-5 shadow-sm">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="text-base font-bold">Bài viết chờ duyệt</h2>
        <p className="mt-1 text-xs font-semibold text-[#6b7280]">
          Bài của thành viên cần admin duyệt trước khi hiển thị.
        </p>
      </div>
      <span className="rounded-full bg-[#eef5ff] px-3 py-1 text-xs font-bold text-[#1877f2]">
        {posts.length}
      </span>
    </div>

    {loading ? (
      <div className="rounded-md bg-[#f2f3f5] p-5 text-center text-sm font-semibold text-[#6b7280]">
        Đang tải bài chờ duyệt...
      </div>
    ) : posts.length === 0 ? (
      <div className="rounded-md bg-[#f2f3f5] p-5 text-center text-sm font-semibold text-[#6b7280]">
        Không có bài viết nào đang chờ duyệt.
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
                    {author.fullName || "Người dùng"}
                  </p>
                  <p className="text-xs font-semibold text-[#6b7280]">
                    Đang chờ duyệt
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
                  label={actionKey === rejectKey ? "Đang từ chối..." : "Từ chối"}
                  disabled={!!actionKey}
                  onClick={() => onReject(post)}
                />
                <ActionButton
                  label={actionKey === approveKey ? "Đang duyệt..." : "Duyệt bài"}
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

const EditGroupModal = ({
  form,
  saving,
  onChange,
  onClose,
  onSubmit,
}) => (
  <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 px-4 py-8">
    <form
      onSubmit={onSubmit}
      className="w-full max-w-xl rounded-lg bg-white p-5 shadow-2xl"
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">Chỉnh sửa nhóm</h2>
          <p className="mt-1 text-sm text-[#6b7280]">
            Cập nhật thông tin hiển thị trên trang nhóm.
          </p>
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

      <div className="space-y-4">
        <Field label="Tên nhóm">
          <input
            value={form.name}
            onChange={(event) =>
              onChange((current) => ({ ...current, name: event.target.value }))
            }
            className="h-11 w-full rounded-md border border-[#dddfe2] px-3 text-sm outline-none focus:border-[#1877f2]"
            placeholder="Tên nhóm"
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
            placeholder="Mô tả nhóm"
          />
        </Field>

        <Field label="Avatar nhóm">
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
              Chỉ thành viên mới xem được nội dung nhóm.
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
          disabled={saving}
          className="rounded-md bg-[#1877f2] px-5 py-2 text-sm font-semibold text-white hover:bg-[#166fe5] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Đang lưu..." : "Lưu thay đổi"}
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

const ManageListPanel = ({
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
    <section className="rounded bg-white p-5 shadow-sm">
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
                  ? "Nhóm riêng tư"
                  : "Nhóm công khai"
                : `${people.length} mục trong danh sách`}
            </p>
          </div>
        </div>

        {!canManage && ["invites", "requests"].includes(activeList) ? (
          <span className="rounded-full bg-[#f2f3f5] px-3 py-1 text-xs font-semibold text-[#6b7280]">
            Chỉ admin xem được
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
        <EmptyList text="Bạn cần quyền admin để xem danh sách này." />
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
        {group.isPrivate ? "Nhóm riêng tư" : "Nhóm công khai"}
      </p>
      <p className="mt-1 text-xs font-semibold text-[#6b7280]">
        {group.isPrivate
          ? "Chỉ thành viên nhóm mới xem được bài viết trong nhóm."
          : "Mọi người có thể tìm thấy nhóm, nhưng bài viết nhóm vẫn theo quyền truy cập hiện tại."}
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
          <span className="mt-2 block text-sm font-bold">Công khai</span>
          <span className="mt-1 block text-xs font-semibold text-[#6b7280]">
            Cho phép mọi người tìm thấy nhóm.
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
          <span className="mt-2 block text-sm font-bold">Riêng tư</span>
          <span className="mt-1 block text-xs font-semibold text-[#6b7280]">
            Ưu tiên nội dung chỉ dành cho thành viên.
          </span>
        </button>
      </div>
    ) : (
      <div className="rounded-md bg-[#f2f3f5] p-4 text-sm font-semibold text-[#6b7280]">
        Chỉ admin mới có thể thay đổi quyền riêng tư nhóm.
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
            {person.fullName || "Người dùng"}
          </p>
          <p className="flex items-center gap-2 text-xs text-[#6b7280]">
            <span
              className={`h-2 w-2 rounded-full ${
                person.isOnline ? "bg-emerald-500" : "bg-[#9ca3af]"
              }`}
            />
            {isSelf ? "Bạn" : person.isOnline ? "Online" : "View profile"}
          </p>
        </div>
      </Link>

      {canManage ? (
        <div className="flex flex-wrap gap-2">
          {activeList === "requests" ? (
            <>
              <ActionButton
                label={actionKey === approveKey ? "Đang duyệt..." : "Chấp nhận"}
                tone="primary"
                disabled={!!actionKey}
                onClick={() => onApproveRequest(person)}
              />
              <ActionButton label="Từ chối" disabled note="Chưa có API" />
            </>
          ) : null}

          {activeList === "members" ? (
            <>
              <ActionButton
                label={actionKey === adminKey ? "Đang thêm..." : "Thêm admin"}
                tone="primary"
                disabled={!!actionKey || isAdmin}
                note={isAdmin ? "Đã là admin" : ""}
                onClick={() => onAssignAdmin(person)}
              />
              <ActionButton
                label={actionKey === removeMemberKey ? "Đang xóa..." : "Xóa thành viên"}
                disabled={!!actionKey || isSelf}
                note={isSelf ? "Không thể tự xóa mình" : ""}
                onClick={() => onRemoveMember(person)}
              />
            </>
          ) : null}

          {activeList === "admins" ? (
            <ActionButton
              label="Xóa admin"
              disabled
              note={isSelf ? "Không tự xóa mình" : "Chưa có API"}
            />
          ) : null}

          {activeList === "invites" ? (
            <ActionButton
              label={actionKey === cancelInviteKey ? "Đang xóa..." : "Xóa lời mời"}
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

const SummaryPanel = ({
  activeList,
  counts,
  isCurrentUserAdmin,
  onSelect,
}) => (
  <section className="rounded bg-white p-5 shadow-sm">
    <div className="mb-4">
      <h2 className="text-base font-bold">Quản lý nhóm</h2>
      <p className="mt-1 text-xs font-semibold text-[#6b7280]">
        Bấm vào từng dòng để mở danh sách.
      </p>
    </div>

    <div className="space-y-3">
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
                {key === "privacy" && counts[key] === "Riêng tư"
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
      <p className="text-sm font-semibold text-[#6b7280]">Chưa có dữ liệu.</p>
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
          {person.fullName || "Người dùng"}
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

export default GroupDetail;

import { useCallback, useEffect, useMemo, useState } from "react";
import HomeHeader from "../components/home/HomeHeader";
import { adminAPI } from "../services/api";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchUserProfile } from "../store/slices/userSlice";

const tabs = [
  { id: "users", label: "Người dùng", icon: "group" },
  { id: "posts", label: "Bài viết", icon: "article" },
  { id: "stickers", label: "Sticker", icon: "mood" },
];

const defaultPagination = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
};

const emptyStickerForm = {
  name: "",
  category: "",
  imageUrl: "",
};

export default function AdminDashboard() {
  const dispatch = useAppDispatch();
  const { profile } = useAppSelector((state) => state.user);
  const [activeTab, setActiveTab] = useState("users");
  const [stats, setStats] = useState({
    users: 0,
    posts: 0,
    stickers: 0,
    bannedUsers: 0,
  });
  const [keyword, setKeyword] = useState("");
  const [appliedKeyword, setAppliedKeyword] = useState("");
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [stickers, setStickers] = useState([]);
  const [pagination, setPagination] = useState(defaultPagination);
  const [pageByTab, setPageByTab] = useState({
    users: 1,
    posts: 1,
    stickers: 1,
  });
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [stickerForm, setStickerForm] = useState(emptyStickerForm);
  const [editingStickerId, setEditingStickerId] = useState("");

  const currentPage = pageByTab[activeTab] || 1;

  const loadStats = useCallback(async () => {
    try {
      const response = await adminAPI.getStats();
      setStats(response.data?.data || {});
    } catch (err) {
      console.error("Unable to load admin stats:", err);
    }
  }, []);

  const loadActiveData = useCallback(async () => {
    setLoading(true);
    setError("");

    const params = {
      page: currentPage,
      limit: 10,
      keyword: appliedKeyword.trim(),
    };

    try {
      let response;

      if (activeTab === "users") {
        response = await adminAPI.getUsers(params);
        setUsers(response.data?.data?.users || []);
      }

      if (activeTab === "posts") {
        response = await adminAPI.getPosts(params);
        setPosts(response.data?.data?.posts || []);
      }

      if (activeTab === "stickers") {
        response = await adminAPI.getStickers(params);
        setStickers(response.data?.data?.stickers || []);
      }

      setPagination(response?.data?.data?.pagination || defaultPagination);
    } catch (err) {
      setError(err.response?.data?.message || "Không tải được dữ liệu admin.");
    } finally {
      setLoading(false);
    }
  }, [activeTab, appliedKeyword, currentPage]);

  useEffect(() => {
    dispatch(fetchUserProfile());

    const timer = window.setTimeout(() => {
      loadStats();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [dispatch, loadStats]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadActiveData();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadActiveData]);

  const tableTitle = useMemo(() => {
    return tabs.find((tab) => tab.id === activeTab)?.label || "Quản lý";
  }, [activeTab]);

  const showMessage = (text) => {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 2500);
  };

  const handleSearch = (event) => {
    event.preventDefault();
    setAppliedKeyword(keyword);
    setPageByTab((pages) => ({ ...pages, [activeTab]: 1 }));
  };

  const handleChangePage = (nextPage) => {
    if (nextPage < 1 || nextPage > pagination.totalPages || loading) return;

    setPageByTab((pages) => ({ ...pages, [activeTab]: nextPage }));
  };

  const handleUserStatusChange = async (userId, status) => {
    setActionId(userId);
    setError("");

    try {
      const response = await adminAPI.updateUserStatus(userId, status);
      const updatedUser = response.data?.data;
      setUsers((items) =>
        items.map((user) => (user._id === userId ? updatedUser : user)),
      );
      showMessage("Đã cập nhật trạng thái người dùng.");
      loadStats();
    } catch (err) {
      setError(err.response?.data?.message || "Không cập nhật được user.");
    } finally {
      setActionId("");
    }
  };

  const handleDeleteUser = async (userId) => {
    const confirmed = window.confirm("Xoá người dùng này và toàn bộ bài viết của họ?");
    if (!confirmed) return;

    setActionId(userId);
    setError("");

    try {
      await adminAPI.deleteUser(userId);
      setUsers((items) => items.filter((user) => user._id !== userId));
      showMessage("Đã xoá người dùng.");
      loadStats();
    } catch (err) {
      setError(err.response?.data?.message || "Không xoá được user.");
    } finally {
      setActionId("");
    }
  };

  const handleDeletePost = async (postId) => {
    const confirmed = window.confirm("Xoá bài viết này?");
    if (!confirmed) return;

    setActionId(postId);
    setError("");

    try {
      await adminAPI.deletePost(postId);
      setPosts((items) => items.filter((post) => post._id !== postId));
      showMessage("Đã xoá bài viết.");
      loadStats();
    } catch (err) {
      setError(err.response?.data?.message || "Không xoá được bài viết.");
    } finally {
      setActionId("");
    }
  };

  const handleStickerSubmit = async (event) => {
    event.preventDefault();
    setActionId(editingStickerId || "new-sticker");
    setError("");

    try {
      if (editingStickerId) {
        await adminAPI.updateSticker(editingStickerId, stickerForm);
        showMessage("Đã cập nhật sticker.");
      } else {
        await adminAPI.createSticker(stickerForm);
        showMessage("Đã thêm sticker.");
      }

      setStickerForm(emptyStickerForm);
      setEditingStickerId("");
      await Promise.all([loadActiveData(), loadStats()]);
    } catch (err) {
      setError(err.response?.data?.message || "Không lưu được sticker.");
    } finally {
      setActionId("");
    }
  };

  const handleEditSticker = (sticker) => {
    setEditingStickerId(sticker._id);
    setStickerForm({
      name: sticker.name || "",
      category: sticker.category || "",
      imageUrl: sticker.imageUrl || "",
    });
  };

  const handleDeleteSticker = async (stickerId) => {
    const confirmed = window.confirm("Xoá sticker này?");
    if (!confirmed) return;

    setActionId(stickerId);
    setError("");

    try {
      await adminAPI.deleteSticker(stickerId);
      setStickers((items) => items.filter((sticker) => sticker._id !== stickerId));
      showMessage("Đã xoá sticker.");
      loadStats();
    } catch (err) {
      setError(err.response?.data?.message || "Không xoá được sticker.");
    } finally {
      setActionId("");
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f2f5] text-[#111827]">
      <HomeHeader profile={profile} activePage="admin" />

      <main className="mx-auto max-w-[1280px] px-4 py-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-[#1877f2]">
              Admin dashboard
            </p>
            <h1 className="text-3xl font-bold">Quản trị hệ thống</h1>
            <p className="mt-1 text-sm text-[#65676b]">
              Quản lý người dùng, bài viết và kho sticker của ZaloUTE.
            </p>
          </div>

          <form
            onSubmit={handleSearch}
            className="flex w-full gap-2 rounded-lg bg-white p-2 shadow-sm md:w-[420px]"
          >
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder={`Tìm trong ${tableTitle.toLowerCase()}...`}
              className="min-w-0 flex-1 rounded-md border border-[#e5e7eb] px-3 py-2 text-sm outline-none focus:border-[#1877f2]"
            />
            <button
              type="submit"
              className="rounded-md bg-[#1877f2] px-4 py-2 text-sm font-semibold text-white hover:bg-[#166fe5]"
            >
              Tìm
            </button>
          </form>
        </div>

        <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Người dùng" value={stats.users} icon="group" />
          <StatCard label="Bài viết" value={stats.posts} icon="article" />
          <StatCard label="Sticker" value={stats.stickers} icon="mood" />
          <StatCard label="Tài khoản bị cấm" value={stats.bannedUsers} icon="block" />
        </section>

        <section className="rounded-lg bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e5e7eb] p-4">
            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id);
                    setKeyword("");
                    setAppliedKeyword("");
                  }}
                  className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold ${
                    activeTab === tab.id
                      ? "bg-[#e7f3ff] text-[#1877f2]"
                      : "text-[#65676b] hover:bg-[#f2f3f5]"
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {tab.icon}
                  </span>
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="text-sm text-[#65676b]">
              Tổng: <span className="font-semibold">{pagination.total}</span>
            </div>
          </div>

          {message ? (
            <div className="mx-4 mt-4 rounded-md bg-[#e7f7ee] px-4 py-3 text-sm font-semibold text-[#047857]">
              {message}
            </div>
          ) : null}

          {error ? (
            <div className="mx-4 mt-4 rounded-md bg-[#fee2e2] px-4 py-3 text-sm font-semibold text-[#b91c1c]">
              {error}
            </div>
          ) : null}

          {activeTab === "stickers" ? (
            <StickerForm
              form={stickerForm}
              editing={Boolean(editingStickerId)}
              saving={actionId === "new-sticker" || actionId === editingStickerId}
              onChange={setStickerForm}
              onSubmit={handleStickerSubmit}
              onCancel={() => {
                setEditingStickerId("");
                setStickerForm(emptyStickerForm);
              }}
            />
          ) : null}

          <div className="overflow-x-auto">
            {activeTab === "users" ? (
              <UsersTable
                users={users}
                loading={loading}
                actionId={actionId}
                onStatusChange={handleUserStatusChange}
                onDelete={handleDeleteUser}
              />
            ) : null}

            {activeTab === "posts" ? (
              <PostsTable
                posts={posts}
                loading={loading}
                actionId={actionId}
                onDelete={handleDeletePost}
              />
            ) : null}

            {activeTab === "stickers" ? (
              <StickersTable
                stickers={stickers}
                loading={loading}
                actionId={actionId}
                onEdit={handleEditSticker}
                onDelete={handleDeleteSticker}
              />
            ) : null}
          </div>

          <Pagination
            pagination={pagination}
            loading={loading}
            onChangePage={handleChangePage}
          />
        </section>
      </main>
    </div>
  );
}

const StatCard = ({ label, value, icon }) => (
  <div className="rounded-lg bg-white p-5 shadow-sm">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-semibold text-[#65676b]">{label}</p>
        <p className="mt-2 text-3xl font-bold">{value || 0}</p>
      </div>
      <span className="material-symbols-outlined rounded-full bg-[#e7f3ff] p-3 text-[#1877f2]">
        {icon}
      </span>
    </div>
  </div>
);

const UsersTable = ({ users, loading, actionId, onStatusChange, onDelete }) => (
  <table className="min-w-full text-left text-sm">
    <TableHead columns={["Tên", "Email", "Vai trò", "Trạng thái", "Ngày tạo", ""]} />
    <tbody>
      {loading ? <LoadingRow colSpan={6} /> : null}
      {!loading && users.length === 0 ? <EmptyRow colSpan={6} /> : null}
      {!loading
        ? users.map((user) => (
            <tr key={user._id} className="border-b border-[#f0f2f5]">
              <td className="px-4 py-3 font-semibold">{user.fullName || "No name"}</td>
              <td className="px-4 py-3 text-[#65676b]">{user.account?.email || "-"}</td>
              <td className="px-4 py-3">{user.account?.role || "user"}</td>
              <td className="px-4 py-3">
                <select
                  value={user.account?.status || "pending"}
                  disabled={actionId === user._id}
                  onChange={(event) => onStatusChange(user._id, event.target.value)}
                  className="rounded-md border border-[#d1d5db] px-2 py-1 outline-none focus:border-[#1877f2]"
                >
                  <option value="active">active</option>
                  <option value="inactive">inactive</option>
                  <option value="banned">banned</option>
                  <option value="pending">pending</option>
                </select>
              </td>
              <td className="px-4 py-3 text-[#65676b]">
                {formatDate(user.createdAt || user.account?.createdAt)}
              </td>
              <td className="px-4 py-3 text-right">
                <DangerButton
                  disabled={actionId === user._id}
                  label="Xoá"
                  onClick={() => onDelete(user._id)}
                />
              </td>
            </tr>
          ))
        : null}
    </tbody>
  </table>
);

const PostsTable = ({ posts, loading, actionId, onDelete }) => (
  <table className="min-w-full text-left text-sm">
    <TableHead columns={["Tác giả", "Nội dung", "Tương tác", "Ngày tạo", ""]} />
    <tbody>
      {loading ? <LoadingRow colSpan={5} /> : null}
      {!loading && posts.length === 0 ? <EmptyRow colSpan={5} /> : null}
      {!loading
        ? posts.map((post) => (
            <tr key={post._id} className="border-b border-[#f0f2f5]">
              <td className="px-4 py-3 font-semibold">
                {post.author?.fullName || "Unknown"}
              </td>
              <td className="max-w-[460px] px-4 py-3 text-[#374151]">
                <p className="line-clamp-2">{post.content || "-"}</p>
              </td>
              <td className="px-4 py-3 text-[#65676b]">
                {(post.likes?.length || 0)} likes • {post.commentCount || 0} comments
              </td>
              <td className="px-4 py-3 text-[#65676b]">{formatDate(post.createdAt)}</td>
              <td className="px-4 py-3 text-right">
                <DangerButton
                  disabled={actionId === post._id}
                  label="Xoá"
                  onClick={() => onDelete(post._id)}
                />
              </td>
            </tr>
          ))
        : null}
    </tbody>
  </table>
);

const StickersTable = ({ stickers, loading, actionId, onEdit, onDelete }) => (
  <table className="min-w-full text-left text-sm">
    <TableHead columns={["Ảnh", "Tên", "Danh mục", "Ngày tạo", ""]} />
    <tbody>
      {loading ? <LoadingRow colSpan={5} /> : null}
      {!loading && stickers.length === 0 ? <EmptyRow colSpan={5} /> : null}
      {!loading
        ? stickers.map((sticker) => (
            <tr key={sticker._id} className="border-b border-[#f0f2f5]">
              <td className="px-4 py-3">
                <img
                  src={sticker.imageUrl}
                  alt={sticker.name}
                  className="h-12 w-12 rounded-md border border-[#e5e7eb] object-cover"
                />
              </td>
              <td className="px-4 py-3 font-semibold">{sticker.name}</td>
              <td className="px-4 py-3 text-[#65676b]">{sticker.category || "-"}</td>
              <td className="px-4 py-3 text-[#65676b]">{formatDate(sticker.createdAt)}</td>
              <td className="px-4 py-3 text-right">
                <button
                  type="button"
                  onClick={() => onEdit(sticker)}
                  className="mr-2 rounded-md bg-[#e7f3ff] px-3 py-1.5 text-sm font-semibold text-[#1877f2] hover:bg-[#dbeafe]"
                >
                  Sửa
                </button>
                <DangerButton
                  disabled={actionId === sticker._id}
                  label="Xoá"
                  onClick={() => onDelete(sticker._id)}
                />
              </td>
            </tr>
          ))
        : null}
    </tbody>
  </table>
);

const StickerForm = ({ form, editing, saving, onChange, onSubmit, onCancel }) => (
  <form
    onSubmit={onSubmit}
    className="m-4 grid gap-3 rounded-lg border border-[#e5e7eb] bg-[#f8fafc] p-4 lg:grid-cols-[1fr_1fr_2fr_auto]"
  >
    <input
      value={form.name}
      onChange={(event) => onChange({ ...form, name: event.target.value })}
      placeholder="Tên sticker"
      className="rounded-md border border-[#d1d5db] px-3 py-2 text-sm outline-none focus:border-[#1877f2]"
      required
    />
    <input
      value={form.category}
      onChange={(event) => onChange({ ...form, category: event.target.value })}
      placeholder="Danh mục"
      className="rounded-md border border-[#d1d5db] px-3 py-2 text-sm outline-none focus:border-[#1877f2]"
    />
    <input
      value={form.imageUrl}
      onChange={(event) => onChange({ ...form, imageUrl: event.target.value })}
      placeholder="Image URL"
      className="rounded-md border border-[#d1d5db] px-3 py-2 text-sm outline-none focus:border-[#1877f2]"
      required
    />
    <div className="flex gap-2">
      <button
        type="submit"
        disabled={saving}
        className="rounded-md bg-[#1877f2] px-4 py-2 text-sm font-semibold text-white hover:bg-[#166fe5] disabled:opacity-60"
      >
        {editing ? "Lưu" : "Thêm"}
      </button>
      {editing ? (
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md bg-[#e5e7eb] px-4 py-2 text-sm font-semibold text-[#374151] hover:bg-[#d1d5db]"
        >
          Huỷ
        </button>
      ) : null}
    </div>
  </form>
);

const Pagination = ({ pagination, loading, onChangePage }) => (
  <div className="flex items-center justify-between gap-3 p-4 text-sm text-[#65676b]">
    <span>
      Trang {pagination.page || 1}/{pagination.totalPages || 1}
    </span>
    <div className="flex gap-2">
      <button
        type="button"
        disabled={loading || pagination.page <= 1}
        onClick={() => onChangePage((pagination.page || 1) - 1)}
        className="rounded-md border border-[#d1d5db] px-3 py-2 font-semibold disabled:opacity-50"
      >
        Trước
      </button>
      <button
        type="button"
        disabled={loading || pagination.page >= pagination.totalPages}
        onClick={() => onChangePage((pagination.page || 1) + 1)}
        className="rounded-md border border-[#d1d5db] px-3 py-2 font-semibold disabled:opacity-50"
      >
        Sau
      </button>
    </div>
  </div>
);

const TableHead = ({ columns }) => (
  <thead className="bg-[#f8fafc] text-xs uppercase text-[#65676b]">
    <tr>
      {columns.map((column) => (
        <th key={column} className="px-4 py-3 font-bold">
          {column}
        </th>
      ))}
    </tr>
  </thead>
);

const LoadingRow = ({ colSpan }) => (
  <tr>
    <td colSpan={colSpan} className="px-4 py-8 text-center text-[#65676b]">
      Đang tải dữ liệu...
    </td>
  </tr>
);

const EmptyRow = ({ colSpan }) => (
  <tr>
    <td colSpan={colSpan} className="px-4 py-8 text-center text-[#65676b]">
      Không có dữ liệu.
    </td>
  </tr>
);

const DangerButton = ({ label, disabled, onClick }) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onClick}
    className="rounded-md bg-[#fee2e2] px-3 py-1.5 text-sm font-semibold text-[#b91c1c] hover:bg-[#fecaca] disabled:opacity-60"
  >
    {disabled ? "..." : label}
  </button>
);

const formatDate = (value) => {
  if (!value) return "-";

  return new Date(value).toLocaleString("vi-VN");
};

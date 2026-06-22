import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { UserAvatar } from "../../components/common";
import HomeHeader from "../../components/home/HomeHeader";
import { userAPI } from "../../services/api";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { fetchUserProfile } from "../../redux/slices/userSlice";

const filters = [
  { key: "all", label: "Tất cả", icon: "feed" },
  { key: "user", label: "Mọi người", icon: "groups" },
  { key: "group", label: "Nhóm", icon: "diversity_3" },
  { key: "post", label: "Bài viết", icon: "article" },
];

const getId = (item) => item?._id || item?.id || item?.userId || "";

const SearchPage = () => {
  const dispatch = useAppDispatch();
  const { profile } = useAppSelector((state) => state.user);
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const type = searchParams.get("type") || "all";
  const [data, setData] = useState(null);
  const [nextLimit, setNextLimit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadSearch = useCallback(
    async (limit = 10) => {
      const value = query.trim();
      if (!value) {
        setData(null);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const response = await userAPI.globalSearch(value, type, limit);
        setData(response.data?.data || null);
        setNextLimit(response.data?.nextLimit || limit + 10);
      } catch (err) {
        setData(null);
        setError(err.response?.data?.message || "Không thể tìm kiếm.");
      } finally {
        setLoading(false);
      }
    },
    [query, type],
  );

  useEffect(() => {
    dispatch(fetchUserProfile());
  }, [dispatch]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadSearch(10);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadSearch]);

  const normalized = useMemo(() => {
    if (!data) {
      return { users: [], groups: [], posts: [] };
    }

    if (type === "all") {
      return {
        users: data.users || [],
        groups: data.groups || [],
        posts: data.posts || [],
      };
    }

    return {
      users: type === "user" ? data || [] : [],
      groups: type === "group" ? data || [] : [],
      posts: type === "post" ? data || [] : [],
    };
  }, [data, type]);

  const totalCount =
    normalized.users.length + normalized.groups.length + normalized.posts.length;

  const handleFilterChange = (nextType) => {
    const params = { q: query };
    if (nextType !== "all") {
      params.type = nextType;
    }
    setSearchParams(params);
  };

  return (
    <div className="min-h-screen bg-[#f2f3f5] text-[#111827]">
      <div className="min-h-screen w-full bg-white">
        <HomeHeader profile={profile} />

        <main className="grid min-h-[calc(100vh-80px)] grid-cols-1 bg-[#f2f3f5] lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="bg-white px-5 py-5 shadow-sm">
            <h1 className="text-2xl font-bold">Kết quả tìm kiếm</h1>
            <div className="my-5 h-px bg-[#e5e7eb]" />
            <h2 className="mb-3 text-sm font-bold text-[#6b7280]">Bộ lọc</h2>

            <nav className="space-y-2">
              {filters.map((item) => (
                <button
                  type="button"
                  key={item.key}
                  onClick={() => handleFilterChange(item.key)}
                  className={`flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-sm font-bold ${
                    type === item.key
                      ? "bg-[#e7f3ff] text-[#1877f2]"
                      : "hover:bg-[#f2f3f5]"
                  }`}
                >
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-full ${
                      type === item.key
                        ? "bg-[#1877f2] text-white"
                        : "bg-[#f1f3f5] text-[#4b5563]"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {item.icon}
                    </span>
                  </span>
                  {item.label}
                </button>
              ))}
            </nav>
          </aside>

          <section className="px-5 py-8">
            <div className="mx-auto max-w-3xl space-y-5">
              <section className="rounded bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase text-[#1877f2]">
                  Từ khóa
                </p>
                <h2 className="mt-1 text-xl font-bold">
                  {query ? `"${query}"` : "Nhập từ khóa để tìm kiếm"}
                </h2>
                <p className="mt-1 text-sm text-[#6b7280]">
                  {loading
                    ? "Đang tải kết quả..."
                    : `${totalCount} kết quả đang hiển thị`}
                </p>
              </section>

              {error ? <StatusCard icon="error" message={error} tone="error" /> : null}
              {loading ? <StatusCard icon="sync" message="Đang tìm kiếm..." loading /> : null}

              {!loading && !error && query && totalCount === 0 ? (
                <StatusCard
                  icon="search_off"
                  message="Không tìm thấy kết quả phù hợp."
                  detail="Thử từ khóa khác hoặc đổi bộ lọc tìm kiếm."
                />
              ) : null}

              {!loading && !error && normalized.users.length > 0 ? (
                <ResultSection title="Mọi người">
                  {normalized.users.map((user) => (
                    <UserResult key={getId(user)} user={user} />
                  ))}
                </ResultSection>
              ) : null}

              {!loading && !error && normalized.groups.length > 0 ? (
                <ResultSection title="Nhóm">
                  {normalized.groups.map((group) => (
                    <GroupResult key={getId(group)} group={group} />
                  ))}
                </ResultSection>
              ) : null}

              {!loading && !error && normalized.posts.length > 0 ? (
                <ResultSection title="Bài viết">
                  {normalized.posts.map((post) => (
                    <PostResult key={getId(post)} post={post} />
                  ))}
                </ResultSection>
              ) : null}

              {!loading && !error && totalCount > 0 ? (
                <button
                  type="button"
                  onClick={() => loadSearch(nextLimit)}
                  className="w-full rounded-md bg-[#e5e7eb] px-5 py-3 text-sm font-bold hover:bg-[#d1d5db]"
                >
                  Xem thêm
                </button>
              ) : null}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

const ResultSection = ({ title, children }) => (
  <section className="rounded bg-white p-5 shadow-sm">
    <h2 className="mb-4 text-lg font-bold">{title}</h2>
    <div className="space-y-2">{children}</div>
  </section>
);

const UserResult = ({ user }) => {
  const relation = user.relationStatus || user.relation || "none";
  const actionLabel =
    relation === "friend"
      ? "Bạn bè"
      : relation === "sent_request"
        ? "Đã gửi lời mời"
        : relation === "received_request"
          ? "Phản hồi"
          : "Thêm bạn bè";

  return (
    <Link
      to={`/users/profile/${getId(user)}`}
      className="flex items-center justify-between gap-4 rounded-md p-3 hover:bg-[#f2f3f5]"
    >
      <div className="flex min-w-0 items-center gap-3">
        <UserAvatar image={user.avatar} name={user.fullName || "User"} />
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">{user.fullName}</p>
          <p className="text-xs text-[#6b7280]">{actionLabel}</p>
        </div>
      </div>
      <span className="rounded-md bg-[#e7f3ff] px-4 py-2 text-xs font-bold text-[#1877f2]">
        Xem
      </span>
    </Link>
  );
};

const GroupResult = ({ group }) => (
  <Link
    to={`/groups/${getId(group)}`}
    className="flex items-center justify-between gap-4 rounded-md p-3 hover:bg-[#f2f3f5]"
  >
    <div className="flex min-w-0 items-center gap-3">
      <span className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-[#e7f3ff] text-[#1877f2]">
        {group.avatar ? (
          <img className="h-full w-full object-cover" src={group.avatar} alt={group.name} />
        ) : (
          <span className="material-symbols-outlined text-[22px]">groups</span>
        )}
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-bold">{group.name}</p>
        <p className="text-xs text-[#6b7280]">Nhóm</p>
      </div>
    </div>
    <span className="rounded-md bg-[#e7f3ff] px-4 py-2 text-xs font-bold text-[#1877f2]">
      Xem nhóm
    </span>
  </Link>
);

const PostResult = ({ post }) => (
  <Link
    to={`/?postId=${encodeURIComponent(getId(post))}`}
    className="block rounded-md p-3 hover:bg-[#f2f3f5]"
  >
    <div className="flex items-center gap-3">
      <UserAvatar
        image={post.author?.avatar}
        name={post.author?.fullName || "User"}
        size="sm"
      />
      <div>
        <p className="text-sm font-bold">
          {post.author?.fullName || "Bài viết"}
        </p>
        <p className="text-xs text-[#6b7280]">
          {post.createdAt ? new Date(post.createdAt).toLocaleString() : "Bài viết"}
        </p>
      </div>
    </div>
    <p className="mt-3 line-clamp-3 text-sm text-[#4b5563]">
      {post.content || "Bài viết không có nội dung chữ."}
    </p>
  </Link>
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

export default SearchPage;

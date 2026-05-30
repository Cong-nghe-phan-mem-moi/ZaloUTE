import { useEffect, useMemo, useState } from "react";
import TopAppBar from "../components/layout/TopAppBar";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchUserProfile } from "../store/slices/userSlice";
import { userAPI } from "../services/api";

const FriendRequests = () => {
  const dispatch = useAppDispatch();
  const { profile } = useAppSelector((state) => state.user);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const loadRequests = async () => {
    setLoading(true);
    setError("");

    try {
      const [incomingResponse, outgoingResponse] = await Promise.all([
        userAPI.getIncomingFriendRequests(),
        userAPI.getOutgoingFriendRequests(),
      ]);

      setIncomingRequests(incomingResponse.data?.data || []);
      setOutgoingRequests(outgoingResponse.data?.data || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Khong the tai danh sach loi moi ket ban.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    dispatch(fetchUserProfile());
    loadRequests();
  }, [dispatch]);

  const refreshAll = async () => {
    await Promise.all([dispatch(fetchUserProfile()), loadRequests()]);
  };

  const handleAccept = async (senderId) => {
    if (!senderId || actionLoadingId) return;

    setActionLoadingId(senderId);
    setNotice("");

    try {
      const response = await userAPI.acceptFriendRequest(senderId);
      await refreshAll();
      setNotice(response.data?.message || "Friend request accepted.");
    } catch (err) {
      setNotice(
        err.response?.data?.message || "Khong the chap nhan loi moi ket ban.",
      );
    } finally {
      setActionLoadingId("");
    }
  };

  const handleReject = async (senderId) => {
    if (!senderId || actionLoadingId) return;

    setActionLoadingId(senderId);
    setNotice("");

    try {
      const response = await userAPI.rejectFriendRequest(senderId);
      await refreshAll();
      setNotice(response.data?.message || "Friend request rejected.");
    } catch (err) {
      setNotice(
        err.response?.data?.message || "Khong the tu choi loi moi ket ban.",
      );
    } finally {
      setActionLoadingId("");
    }
  };

  const handleCancel = async (receiverId) => {
    if (!receiverId || actionLoadingId) return;

    setActionLoadingId(receiverId);
    setNotice("");

    try {
      const response = await userAPI.cancelFriendRequest(receiverId);
      await refreshAll();
      setNotice(response.data?.message || "Friend request cancelled.");
    } catch (err) {
      setNotice(
        err.response?.data?.message || "Khong the huy loi moi ket ban.",
      );
    } finally {
      setActionLoadingId("");
    }
  };

  const hasRequests =
    incomingRequests.length > 0 || outgoingRequests.length > 0;
  const stats = useMemo(
    () => [
      { label: "Incoming", value: incomingRequests.length },
      { label: "Outgoing", value: outgoingRequests.length },
    ],
    [incomingRequests.length, outgoingRequests.length],
  );

  return (
    <div className="min-h-screen bg-[#f0f2f5] text-[#050505]">
      <TopAppBar profile={profile} />

      <main className="mx-auto max-w-5xl px-4 py-6 space-y-4">
        <section className="bg-white rounded-lg shadow-sm border border-[#dddfe2] p-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold">Friend requests</h1>
              <p className="text-sm text-[#65676b]">
                Manage incoming and outgoing requests in one place.
              </p>
            </div>
            <div className="flex gap-3">
              {stats.map((item) => (
                <div
                  key={item.label}
                  className="min-w-24 rounded-lg bg-[#f0f2f5] px-4 py-3 text-center"
                >
                  <div className="text-xl font-bold">{item.value}</div>
                  <div className="text-xs text-[#65676b] uppercase tracking-wide">
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {notice ? (
          <div className="bg-white text-[#050505] p-4 rounded-lg border border-[#dddfe2] shadow-sm">
            {notice}
          </div>
        ) : null}

        {error ? (
          <div className="bg-white text-red-600 p-4 rounded-lg border border-red-100 shadow-sm">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="bg-white rounded-lg shadow-sm border border-[#dddfe2] p-6 text-[#65676b]">
            Loading requests...
          </div>
        ) : null}

        {!loading && !hasRequests ? (
          <div className="bg-white rounded-lg shadow-sm border border-[#dddfe2] p-8 text-center text-[#65676b]">
            No friend requests right now.
          </div>
        ) : null}

        {!loading && incomingRequests.length > 0 ? (
          <section className="bg-white rounded-lg shadow-sm border border-[#dddfe2] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Incoming requests</h2>
              <span className="text-sm text-[#65676b]">
                {incomingRequests.length} pending
              </span>
            </div>

            <div className="space-y-3">
              {incomingRequests.map((request) => (
                <RequestCard
                  key={request.id}
                  user={request.sender}
                  title="sent you a friend request"
                  primaryLabel={
                    actionLoadingId === request.sender?._id
                      ? "Accepting..."
                      : "Accept"
                  }
                  secondaryLabel={
                    actionLoadingId === request.sender?._id
                      ? "Rejecting..."
                      : "Reject"
                  }
                  onPrimary={() => handleAccept(request.sender?._id)}
                  onSecondary={() => handleReject(request.sender?._id)}
                  busy={actionLoadingId === request.sender?._id}
                />
              ))}
            </div>
          </section>
        ) : null}

        {!loading && outgoingRequests.length > 0 ? (
          <section className="bg-white rounded-lg shadow-sm border border-[#dddfe2] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Outgoing requests</h2>
              <span className="text-sm text-[#65676b]">
                {outgoingRequests.length} pending
              </span>
            </div>

            <div className="space-y-3">
              {outgoingRequests.map((request) => (
                <RequestCard
                  key={request.id}
                  user={request.receiver}
                  title="request sent"
                  primaryLabel={
                    actionLoadingId === request.receiver?._id
                      ? "Cancelling..."
                      : "Cancel"
                  }
                  secondaryLabel=""
                  onPrimary={() => handleCancel(request.receiver?._id)}
                  onSecondary={null}
                  busy={actionLoadingId === request.receiver?._id}
                  hideSecondary
                />
              ))}
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
};

const RequestCard = ({
  user,
  title,
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary,
  busy,
  hideSecondary = false,
}) => {
  const fullName = user?.fullName || "Unknown user";
  const avatar = user?.avatar || null;

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-[#dddfe2] p-4 flex-wrap">
      <div className="flex items-center gap-3 min-w-0">
        <Avatar image={avatar} name={fullName} />
        <div className="min-w-0">
          <div className="font-semibold truncate">{fullName}</div>
          <div className="text-sm text-[#65676b]">{title}</div>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onPrimary}
          disabled={busy}
          className="rounded-md bg-[#1877f2] px-4 py-2 text-sm font-semibold text-white hover:bg-[#166fe5] disabled:opacity-60"
        >
          {primaryLabel}
        </button>

        {!hideSecondary ? (
          <button
            type="button"
            onClick={onSecondary}
            disabled={busy}
            className="rounded-md bg-[#e4e6eb] px-4 py-2 text-sm font-semibold text-[#050505] hover:bg-[#d8dadf] disabled:opacity-60"
          >
            {secondaryLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
};

const Avatar = ({ image, name }) => {
  const initials = (name || "U")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div className="w-11 h-11 rounded-full bg-[#dbe7ff] overflow-hidden flex items-center justify-center text-[#1877f2] shrink-0 font-bold">
      {image ? (
        <img
          className="w-full h-full object-cover"
          src={image}
          alt={name || "User"}
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
};

export default FriendRequests;

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { StatusCard, UserAvatar } from "../../components/common";
import HomeHeader from "../../components/home/HomeHeader";
import LeftSidebar from "../../components/home/LeftSidebar";
import RightSidebar from "../../components/home/RightSidebar";
import { useHomeSidebar } from "../../hooks";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { fetchUserProfile } from "../../redux/slices/userSlice";
import { userAPI } from "../../services/user.service";

const FriendRequests = () => {
  const dispatch = useAppDispatch();
  const { profile } = useAppSelector((state) => state.user);
  const {
    contacts,
    groupConversations,
    groupsLoading,
    handleContactClick,
    handleGroupClick,
  } = useHomeSidebar({ dispatch, profile });
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const loadRequests = useCallback(async () => {
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
          "Unable to load friend requests.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    dispatch(fetchUserProfile());
    const timer = window.setTimeout(() => {
      loadRequests();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [dispatch, loadRequests]);

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
        err.response?.data?.message || "Unable to accept friend request.",
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
        err.response?.data?.message || "Unable to reject friend request.",
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
        err.response?.data?.message || "Unable to cancel friend request.",
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
    <div className="min-h-screen bg-[#f2f3f5] text-[#111827]">
      <div className="min-h-screen w-full bg-white">
        <HomeHeader profile={profile} activePage="friends" />

        <main className="grid min-h-[calc(100vh-80px)] grid-cols-1 justify-center bg-[#f2f3f5] lg:grid-cols-[240px_minmax(0,780px)] xl:grid-cols-[260px_minmax(0,820px)_300px] 2xl:grid-cols-[280px_minmax(0,920px)_320px]">
          <LeftSidebar profile={profile} />

          <section className="min-w-0 space-y-4 px-3 py-3 sm:px-4 sm:py-4 lg:space-y-5 lg:px-5 lg:py-5">
            <section className="rounded bg-white p-7 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase text-[#1877f2]">
                    Your network
                  </p>
                  <h1 className="mt-1 text-2xl font-bold">Friend requests</h1>
                  <p className="mt-1 text-sm text-[#6b7280]">
                    Manage incoming and outgoing requests in one place.
                  </p>
                </div>

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

                <Link
                  to="/friends"
                  className="rounded-md bg-[#1877f2] px-5 py-2 text-sm font-semibold text-white shadow-md hover:bg-[#166fe5]"
                >
                  Friends list
                </Link>
              </div>
            </section>

            {notice ? (
              <StatusCard icon="info" message={notice} />
            ) : null}

            {error ? (
              <StatusCard icon="error" message={error} tone="error" />
            ) : null}

            {loading ? (
              <StatusCard icon="sync" message="Loading requests..." loading />
            ) : null}

            {!loading && !error && !hasRequests ? (
              <StatusCard
                icon="group_add"
                message="No friend requests right now."
                detail="New requests will appear here when someone connects with you."
              />
            ) : null}

            {!loading && incomingRequests.length > 0 ? (
              <RequestSection
                title="Incoming requests"
                count={`${incomingRequests.length} pending`}
              >
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
              </RequestSection>
            ) : null}

            {!loading && outgoingRequests.length > 0 ? (
              <RequestSection
                title="Outgoing requests"
                count={`${outgoingRequests.length} pending`}
              >
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
                    onPrimary={() => handleCancel(request.receiver?._id)}
                    busy={actionLoadingId === request.receiver?._id}
                    hideSecondary
                  />
                ))}
              </RequestSection>
            ) : null}
          </section>

          <RightSidebar
            contacts={contacts}
            friendRequests={incomingRequests}
            groupConversations={groupConversations}
            groupsLoading={groupsLoading}
            requestsLoading={loading}
            requestActionId={actionLoadingId}
            onAcceptRequest={handleAccept}
            onRejectRequest={handleReject}
            onContactClick={handleContactClick}
            onGroupClick={handleGroupClick}
          />
        </main>
      </div>
    </div>
  );
};

const RequestSection = ({ title, count, children }) => (
  <section className="rounded bg-white p-5 shadow-sm">
    <div className="mb-5 flex items-center justify-between">
      <h2 className="text-base font-bold">{title}</h2>
      <span className="text-xs font-semibold text-[#6b7280]">{count}</span>
    </div>

    <div className="space-y-3">{children}</div>
  </section>
);

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
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-md bg-white p-4 shadow-sm ring-1 ring-[#eef0f2]">
      <div className="flex min-w-0 items-center gap-3">
        <UserAvatar image={avatar} name={fullName} />
        <div className="min-w-0">
          <div className="truncate text-sm font-bold">{fullName}</div>
          <div className="text-xs text-[#6b7280]">{title}</div>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onPrimary}
          disabled={busy}
          className="rounded-md bg-[#1877f2] px-4 py-2 text-xs font-semibold text-white hover:bg-[#166fe5] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {primaryLabel}
        </button>

        {!hideSecondary ? (
          <button
            type="button"
            onClick={onSecondary}
            disabled={busy}
            className="rounded-md bg-[#e5e7eb] px-4 py-2 text-xs font-semibold text-[#111827] hover:bg-[#d1d5db] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {secondaryLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
};

export default FriendRequests;

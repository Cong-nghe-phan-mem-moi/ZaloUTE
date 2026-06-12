import HomeAvatar from "./HomeAvatar";
import { newsItems } from "./homeData";

const RightSidebar = ({
  contacts = [],
  friendRequests = [],
  requestsLoading = false,
  requestActionId = "",
  onAcceptRequest,
  onRejectRequest,
}) => (
  <aside className="hidden bg-white px-6 py-6 lg:block">
    <PanelTitle title="News Update" action="See All" />
    <div className="space-y-4">
      {newsItems.map((item) => (
        <div key={item.title} className="flex gap-3">
          <div
            className={`h-14 w-16 rounded bg-gradient-to-br ${item.color}`}
          />
          <div>
            <h3 className="text-sm font-bold">{item.title}</h3>
            <p className="text-xs leading-4 text-[#6b7280]">See more</p>
          </div>
        </div>
      ))}
    </div>
    <div className="mt-8">
      <PanelTitle
        title="Friend Requests"
        action="See All"
        href="/friend-requests"
      />

      {requestsLoading ? (
        <EmptyState icon="sync" text="Loading requests..." loading />
      ) : null}

      {!requestsLoading && friendRequests.length === 0 ? (
        <EmptyState icon="group_add" text="No pending requests." />
      ) : null}

      {!requestsLoading && friendRequests.length > 0 ? (
        <div className="space-y-3">
          {friendRequests.slice(0, 3).map((request) => (
            <FriendRequestCard
              key={request.id}
              request={request}
              requestActionId={requestActionId}
              onAcceptRequest={onAcceptRequest}
              onRejectRequest={onRejectRequest}
            />
          ))}
        </div>
      ) : null}
    </div>

    <div className="mt-8">
      <PanelTitle title="Contacts" />
      {contacts.length === 0 ? (
        <EmptyState icon="person_search" text="No friends to show." />
      ) : (
        <div className="space-y-4">
          {contacts.map((contact) => (
            <Contact key={contact.id || contact.name} contact={contact} />
          ))}
        </div>
      )}
    </div>
  </aside>
);

const PanelTitle = ({ title, action, href = "/" }) => (
  <div className="mb-5 flex items-center justify-between">
    <h2 className="text-base font-bold">{title}</h2>
    {action ? (
      <a className="text-xs font-semibold text-[#1877f2]" href={href}>
        {action}
      </a>
    ) : null}
  </div>
);

const getUserId = (user) => user?._id || user?.id || user?.userId || "";

const FriendRequestCard = ({
  request,
  requestActionId,
  onAcceptRequest,
  onRejectRequest,
}) => {
  const sender = request?.sender || {};
  const senderId = getUserId(sender);
  const isBusy = requestActionId === senderId;

  return (
    <div className="rounded bg-[#f2f3f5] p-4">
      <a
        href={senderId ? `/users/profile/${senderId}` : "/friend-requests"}
        className="mb-3 flex items-center gap-3"
      >
        <HomeAvatar image={sender.avatar} name={sender.fullName || "User"} />
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">
            {sender.fullName || "Unknown user"}
          </p>
          <p className="text-xs text-[#6b7280]">Sent you a friend request</p>
        </div>
      </a>

      <div className="flex gap-3 pl-12">
        <button
          type="button"
          onClick={() => onAcceptRequest?.(senderId)}
          disabled={!senderId || isBusy || !onAcceptRequest}
          className="rounded bg-[#1877f2] px-5 py-2 text-xs font-semibold text-white hover:bg-[#166fe5] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isBusy ? "Saving..." : "Confirm"}
        </button>
        <button
          type="button"
          onClick={() => onRejectRequest?.(senderId)}
          disabled={!senderId || isBusy || !onRejectRequest}
          className="rounded bg-[#e5e7eb] px-5 py-2 text-xs font-semibold hover:bg-[#d1d5db] disabled:cursor-not-allowed disabled:opacity-60"
        >
          Delete
        </button>
      </div>
    </div>
  );
};

const Contact = ({ contact }) => (
  <a
    href={contact.id ? `/users/profile/${contact.id}` : "/friends"}
    className="flex items-center gap-3 rounded-md hover:bg-[#f2f3f5]"
  >
    <HomeAvatar image={contact.avatar} name={contact.name} />
    <div>
      <p className="text-sm font-bold">{contact.name}</p>
      <p className="flex items-center gap-2 text-xs text-[#6b7280]">
        <span
          className={`h-2 w-2 rounded-full ${
            contact.online ? "bg-emerald-500" : "bg-[#9ca3af]"
          }`}
        />
        {contact.status}
      </p>
    </div>
  </a>
);

const EmptyState = ({ icon, text, loading = false }) => (
  <div className="rounded bg-[#f2f3f5] p-4 text-center text-xs font-semibold text-[#6b7280]">
    <span
      className={`material-symbols-outlined mb-2 block text-[22px] ${
        loading ? "animate-spin" : ""
      }`}
    >
      {icon}
    </span>
    {text}
  </div>
);

export default RightSidebar;

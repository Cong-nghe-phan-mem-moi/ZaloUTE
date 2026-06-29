import { useState } from "react";
import { Link } from "react-router-dom";
import UserAvatar from "../common/UserAvatar";
import { newsItems } from "./homeData";

const RightSidebar = ({
  contacts = [],
  friendRequests = [],
  groupConversations = [],
  groupsLoading = false,
  requestsLoading = false,
  requestActionId = "",
  onAcceptRequest,
  onRejectRequest,
  onContactClick,
  onGroupClick,
}) => {
  const [activeTab, setActiveTab] = useState("contacts");

  return (
    <aside className="sticky top-20 hidden h-[calc(100vh-80px)] min-h-0 overflow-y-auto bg-white px-5 py-6 xl:block 2xl:px-6">
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
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-bold">Contacts</h2>
          <div className="flex rounded-full bg-[#f2f3f5] p-1 text-xs font-bold">
            <TabButton
              active={activeTab === "contacts"}
              label="Contacts"
              onClick={() => setActiveTab("contacts")}
            />
            <TabButton
              active={activeTab === "groups"}
              label="Groups"
              onClick={() => setActiveTab("groups")}
            />
          </div>
        </div>

        {activeTab === "contacts" ? (
          contacts.length === 0 ? (
            <EmptyState icon="person_search" text="No friends to show." />
          ) : (
            <div className="space-y-4">
              {contacts.map((contact) => (
                <Contact
                  key={contact.id || contact.name}
                  contact={contact}
                  onClick={onContactClick}
                />
              ))}
            </div>
          )
        ) : null}

        {activeTab === "groups" ? (
          groupsLoading ? (
            <EmptyState icon="sync" text="Loading group chats..." loading />
          ) : groupConversations.length === 0 ? (
            <EmptyState icon="forum" text="No group chats to show." />
          ) : (
            <div className="space-y-4">
              {groupConversations.map((conversation) => (
                <GroupConversation
                  key={conversation._id}
                  conversation={conversation}
                  onClick={onGroupClick}
                />
              ))}
            </div>
          )
        ) : null}
      </div>
    </aside>
  );
};

const TabButton = ({ active, label, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`rounded-full px-3 py-1 ${
      active ? "bg-white text-[#1877f2] shadow-sm" : "text-[#6b7280]"
    }`}
  >
    {label}
  </button>
);

const PanelTitle = ({ title, action, href = "/" }) => (
  <div className="mb-5 flex items-center justify-between">
    <h2 className="text-base font-bold">{title}</h2>
    {action ? (
      <Link className="text-xs font-semibold text-[#1877f2]" to={href}>
        {action}
      </Link>
    ) : null}
  </div>
);

const getUserId = (user) => user?._id || user?.id || user?.userId || "";

const openMiniChat = (target) => {
  if (!target) return;

  window.dispatchEvent(
    new CustomEvent("zalo-open-mini-chat", { detail: target }),
  );
};

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
      <Link
        to={senderId ? `/users/profile/${senderId}` : "/friend-requests"}
        className="mb-3 flex items-center gap-3"
      >
        <UserAvatar image={sender.avatar} name={sender.fullName || "User"} />
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">
            {sender.fullName || "Unknown user"}
          </p>
          <p className="text-xs text-[#6b7280]">Sent you a friend request</p>
        </div>
      </Link>

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

const Contact = ({ contact, onClick }) => (
  <button
    type="button"
    onClick={() => (onClick ? onClick(contact) : openMiniChat(contact))}
    className="flex w-full items-center gap-3 rounded-md text-left hover:bg-[#f2f3f5]"
  >
    <UserAvatar image={contact.avatar} name={contact.name} />
    <div>
      <p className="text-sm font-bold">{contact.name}</p>
      <p className="flex items-center gap-2 text-xs text-[#6b7280]">
        <span
          className={`h-2 w-2 rounded-full ${contact.online ? "bg-emerald-500" : "bg-[#9ca3af]"
            }`}
        />
        {contact.status}
      </p>
    </div>
  </button>
);

const GroupConversation = ({ conversation, onClick }) => (
  <button
    type="button"
    onClick={() => (onClick ? onClick(conversation) : openMiniChat(conversation))}
    className="flex w-full items-center gap-3 rounded-md text-left hover:bg-[#f2f3f5]"
  >
    <UserAvatar image={conversation.avatar} name={conversation.name || "Group chat"} />
    <div className="min-w-0">
      <p className="truncate text-sm font-bold">
        {conversation.name || "Group chat"}
      </p>
      <p className="truncate text-xs text-[#6b7280]">
        {(conversation.participants || []).length} members
      </p>
    </div>
  </button>
);

const EmptyState = ({ icon, text, loading = false }) => (
  <div className="rounded bg-[#f2f3f5] p-4 text-center text-xs font-semibold text-[#6b7280]">
    <span
      className={`material-symbols-outlined mb-2 block text-[22px] ${loading ? "animate-spin" : ""
        }`}
    >
      {icon}
    </span>
    {text}
  </div>
);

export default RightSidebar;

import { UserAvatar } from "../../common";
import {
  getConversationAvatar,
  getConversationPreview,
  getConversationTitle,
  getProfileId,
  hasUnreadLastMessage,
} from "../../../utils/chatUtils";

const MessagesDropdown = ({
  conversations,
  loading,
  profile,
  onOpenMessages,
  onOpenConversation,
}) => (
  <div className="absolute right-0 top-12 z-40 w-[360px] overflow-hidden rounded-lg border border-[#e5e7eb] bg-white shadow-2xl">
    <div className="flex items-center justify-between border-b border-[#e5e7eb] px-4 py-3">
      <h2 className="text-lg font-bold text-[#111827]">Chats</h2>
      <button
        type="button"
        onClick={onOpenMessages}
        className="flex h-9 w-9 items-center justify-center rounded-full text-[#111827] hover:bg-[#f2f3f5]"
        title="Open messages"
        aria-label="Open messages"
      >
        <span className="material-symbols-outlined text-[20px]">
          open_in_full
        </span>
      </button>
    </div>

    <div className="max-h-[440px] overflow-y-auto p-2">
      {loading && conversations.length === 0 ? (
        <p className="px-3 py-6 text-center text-sm text-[#6b7280]">
          Loading chats...
        </p>
      ) : null}

      {!loading && conversations.length === 0 ? (
        <p className="px-3 py-6 text-center text-sm text-[#6b7280]">
          No chats yet.
        </p>
      ) : null}

      {conversations.map((conversation) => {
        const profileId = getProfileId(profile);
        const hasUnread = hasUnreadLastMessage(conversation, profileId);

        return (
          <button
            key={conversation._id}
            type="button"
            onClick={() => onOpenConversation?.(conversation)}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left hover:bg-[#f2f3f5]"
          >
            <UserAvatar
              image={getConversationAvatar(conversation, profile)}
              name={getConversationTitle(conversation, profile)}
              size="sm"
            />
            <div className="min-w-0 flex-1">
              <p
                className={`truncate text-sm ${
                  hasUnread
                    ? "font-bold text-[#111827]"
                    : "font-semibold text-[#111827]"
                }`}
              >
                {getConversationTitle(conversation, profile)}
              </p>
              <p
                className={`truncate text-xs ${
                  hasUnread ? "font-semibold text-[#111827]" : "text-[#6b7280]"
                }`}
              >
                {getConversationPreview(conversation, profile)}
              </p>
            </div>
            {hasUnread ? (
              <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#1877f2]" />
            ) : null}
          </button>
        );
      })}
    </div>
  </div>
);

export default MessagesDropdown;

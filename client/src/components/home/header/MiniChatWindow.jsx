import { UserAvatar } from "../../common";
import {
  getConversationAvatar,
  getConversationTitle,
  getId,
  getMiniMessageContent,
  getProfileId,
} from "../../../utils/chatUtils";
import getImageUrl, { getImageFallbackUrl } from "../../../utils/imageUrl";

const MiniChatWindow = ({
  conversation,
  messages,
  loading,
  minimized,
  hasUnread,
  messageText,
  messagesEndRef,
  messagesListRef,
  profile,
  activeStickerPack,
  hasMoreMessages,
  loadingOlder,
  stickerPacks,
  stickersOpen,
  onChangeMessage,
  onClose,
  onLoadOlder,
  onMinimize,
  onRestore,
  onOpenFull,
  onSelectStickerPack,
  onSendMessage,
  onSendSticker,
  onToggleStickers,
}) => {
  const profileId = String(getProfileId(profile) || "");
  const title = getConversationTitle(conversation, profile);
  const avatar = getConversationAvatar(conversation, profile);
  const handleMessagesScroll = (event) => {
    if (event.currentTarget.scrollTop > 24) return;
    if (!hasMoreMessages || loadingOlder || loading) return;
    onLoadOlder?.();
  };

  if (minimized) {
    return (
      <button
        type="button"
        onClick={onRestore}
        className="fixed bottom-4 right-4 z-50 flex w-72 items-center gap-3 rounded-t-lg border border-[#d1d5db] bg-white px-3 py-2 text-left shadow-2xl hover:bg-[#f8fafc]"
      >
        <span className="relative shrink-0">
          <UserAvatar image={avatar} name={title} size="sm" />
          {hasUnread ? (
            <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-[#1877f2]" />
          ) : null}
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-bold text-[#111827]">
          {title}
        </span>
        <span className="material-symbols-outlined text-[18px] text-[#6b7280]">
          keyboard_arrow_up
        </span>
      </button>
    );
  }

  return (
    <section className="fixed bottom-4 right-4 z-50 flex h-[460px] w-80 flex-col overflow-hidden rounded-t-lg border border-[#d1d5db] bg-white shadow-2xl">
      <div className="flex items-center gap-2 border-b border-[#e5e7eb] px-3 py-2">
        <UserAvatar image={avatar} name={title} size="sm" />
        <button
          type="button"
          onClick={onOpenFull}
          className="min-w-0 flex-1 text-left"
          title="Open full conversation"
        >
          <p className="truncate text-sm font-bold text-[#111827]">{title}</p>
          <p className="text-xs text-[#6b7280]">Chat</p>
        </button>
        <button
          type="button"
          onClick={onOpenFull}
          className="flex h-8 w-8 items-center justify-center rounded-full text-[#4b5563] hover:bg-[#f2f3f5]"
          aria-label="Open full conversation"
          title="Open full conversation"
        >
          <span className="material-symbols-outlined text-[18px]">
            open_in_full
          </span>
        </button>
        <button
          type="button"
          onClick={onMinimize}
          className="flex h-8 w-8 items-center justify-center rounded-full text-[#4b5563] hover:bg-[#f2f3f5]"
          aria-label="Minimize chat"
        >
          <span className="material-symbols-outlined text-[18px]">remove</span>
        </button>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-full text-[#4b5563] hover:bg-[#f2f3f5]"
          aria-label="Close chat"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>

      <div
        ref={messagesListRef}
        onScroll={handleMessagesScroll}
        className="flex-1 space-y-2 overflow-y-auto bg-[#f8fafc] px-3 py-3"
      >
        {loadingOlder ? (
          <p className="py-1 text-center text-xs font-semibold text-[#6b7280]">
            Loading older messages...
          </p>
        ) : null}

        {!loadingOlder && hasMoreMessages && messages.length > 0 ? (
          <button
            type="button"
            onClick={onLoadOlder}
            className="mx-auto block rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#1877f2] shadow-sm hover:bg-[#eef5ff]"
          >
            Load older messages
          </button>
        ) : null}

        {loading ? (
          <p className="py-6 text-center text-sm text-[#6b7280]">Loading...</p>
        ) : null}

        {!loading && messages.length === 0 ? (
          <p className="py-6 text-center text-sm text-[#6b7280]">
            No messages yet.
          </p>
        ) : null}

        {messages.map((message) => {
          const isMe = String(getId(message.senderId)) === profileId;
          const content = getMiniMessageContent(message);

          return (
            <div
              key={message._id}
              className={`flex ${isMe ? "justify-end" : "justify-start"}`}
            >
              {message.messageType === "sticker" ? (
                <img
                  src={message.content}
                  alt="Sticker"
                  className="h-24 w-24 rounded-xl object-contain"
                />
              ) : message.messageType === "image" ? (
                <a
                  href={getImageUrl(message.content)}
                  target="_blank"
                  rel="noreferrer"
                  className="block max-w-[78%]"
                >
                  <img
                    src={getImageUrl(message.content)}
                    alt="Chat attachment"
                    className="max-h-48 rounded-2xl object-cover shadow-sm"
                    onError={(event) => {
                      const fallbackUrl = getImageFallbackUrl(message.content);
                      if (fallbackUrl && event.currentTarget.src !== fallbackUrl) {
                        event.currentTarget.src = fallbackUrl;
                      }
                    }}
                  />
                </a>
              ) : (
                <div
                  className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm leading-5 ${
                    isMe
                      ? "rounded-br-sm bg-[#1877f2] text-white"
                      : "rounded-bl-sm bg-white text-[#111827] shadow-sm"
                  }`}
                >
                  {content}
                </div>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="relative border-t border-[#e5e7eb] bg-white">
        {stickersOpen ? (
          <div className="absolute bottom-full left-2 right-2 mb-2 rounded-xl border border-[#e5e7eb] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#e5e7eb] px-2 py-2">
              <div className="flex max-w-[230px] gap-1 overflow-x-auto">
                {stickerPacks.length === 0 ? (
                  <span className="px-2 py-1 text-xs font-semibold text-[#6b7280]">
                    No sticker packs
                  </span>
                ) : (
                  stickerPacks.map((pack, index) => (
                    <button
                      key={pack.name}
                      type="button"
                      onClick={() => onSelectStickerPack?.(index)}
                      className={`shrink-0 rounded-full px-2 py-1 text-xs font-bold ${
                        activeStickerPack === index
                          ? "bg-[#1877f2] text-white"
                          : "bg-[#f2f3f5] text-[#6b7280]"
                      }`}
                    >
                      {pack.name}
                    </button>
                  ))
                )}
              </div>
              <button
                type="button"
                onClick={onToggleStickers}
                className="rounded-full p-1 text-[#6b7280] hover:bg-[#f2f3f5]"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="grid max-h-48 grid-cols-4 gap-2 overflow-y-auto p-2">
              {(stickerPacks[activeStickerPack]?.stickers || []).map((sticker) => (
                <button
                  key={sticker._id}
                  type="button"
                  onClick={() => onSendSticker?.(sticker)}
                  className="rounded-lg p-1 hover:bg-[#f2f3f5]"
                  title={sticker.name}
                >
                  <img
                    src={sticker.imageUrl}
                    alt={sticker.name}
                    className="h-12 w-12 object-contain"
                  />
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <form onSubmit={onSendMessage} className="flex items-center gap-2 px-3 py-2">
          <button
            type="button"
            onClick={onToggleStickers}
            className={`flex h-9 w-9 items-center justify-center rounded-full ${
              stickersOpen
                ? "bg-[#e7f3ff] text-[#1877f2]"
                : "text-[#4b5563] hover:bg-[#f2f3f5]"
            }`}
            aria-label="Open stickers"
          >
            <span className="material-symbols-outlined text-[18px]">
              sticky_note_2
            </span>
          </button>
          <input
            value={messageText}
            onChange={(event) => onChangeMessage(event.target.value)}
            className="min-w-0 flex-1 rounded-full bg-[#f2f3f5] px-4 py-2 text-sm text-[#111827] outline-none focus:ring-2 focus:ring-[#bfdbfe]"
            placeholder="Aa"
          />
          <button
            type="submit"
            disabled={!messageText.trim()}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1877f2] text-white disabled:bg-[#cbd5e1]"
            aria-label="Send message"
          >
            <span className="material-symbols-outlined text-[18px]">send</span>
          </button>
        </form>
      </div>
    </section>
  );
};

export default MiniChatWindow;

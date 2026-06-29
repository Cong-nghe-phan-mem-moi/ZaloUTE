import { useCallback, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  useClickOutside,
  useHeaderChat,
  useHeaderNotifications,
  useLogout,
} from "../../hooks";
import { AppLogo, IconButton, UserAvatar, UserSearchBox } from "../common";
import MessagesDropdown from "./header/MessagesDropdown";
import MiniChatWindow from "./header/MiniChatWindow";
import {
  NotificationPopup,
  NotificationsDropdown,
} from "./header/Notifications";
import ProfileMenu from "./header/ProfileMenu";

const HomeHeader = ({ profile, activePage = "home" }) => {
  const navigate = useNavigate();
  const { isLoggingOut, logout: handleLogout } = useLogout();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const messagesRef = useRef(null);
  const mobileMessagesRef = useRef(null);
  const notificationsRef = useRef(null);
  const profileMenuRef = useRef(null);

  const {
    messagesOpen,
    messageConversations,
    messagesLoading,
    unreadConversationCount,
    miniConversation,
    miniMessages,
    miniLoading,
    miniLoadingOlder,
    miniActiveStickerPack,
    miniHasMoreMessages,
    miniMessageText,
    miniMinimized,
    miniHasUnread,
    miniStickerPacks,
    miniStickersOpen,
    miniMessagesListRef,
    miniMessagesEndRef,
    closeMessages,
    handleMiniMinimize,
    handleMiniRestore,
    handleMiniSendSticker,
    handleMiniSendMessage,
    handleToggleMessages,
    loadOlderMiniMessages,
    openMiniConversation,
    closeMiniConversation,
    setMiniMessageText,
    setMiniActiveStickerPack,
    setMiniStickersOpen,
  } = useHeaderChat(profile);

  const {
    notifications,
    unreadCount,
    newNotificationCount,
    notificationsOpen,
    notificationsLoading,
    popupNotification,
    closeNotifications,
    handleDeleteNotification,
    handleMarkAllAsRead,
    handleNotificationClick,
    handleToggleNotifications,
    setPopupNotification,
  } = useHeaderNotifications(navigate);

  const closeProfileMenu = useCallback(() => setProfileMenuOpen(false), []);

  useClickOutside(messagesRef, closeMessages);
  useClickOutside(mobileMessagesRef, closeMessages);
  useClickOutside(notificationsRef, closeNotifications);
  useClickOutside(profileMenuRef, closeProfileMenu);

  return (
    <>
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-[#e5e7eb] bg-white px-3 py-3 shadow-sm sm:px-5 lg:px-12">
      <div className="flex min-h-10 items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3 lg:gap-5">
          <AppLogo className="shrink-0" />
          <UserSearchBox
            wrapperClassName="relative hidden min-w-0 flex-1 sm:block sm:max-w-72"
            shellClassName="flex h-10 items-center gap-2 rounded-full bg-[#f0f2f5] px-3 text-[#65676b]"
            inputClassName="min-w-0 flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-[#9ca3af]"
          />
        </div>

        <nav className="hidden flex-1 items-center justify-center md:flex lg:absolute lg:left-1/2 lg:top-3 lg:w-[360px] lg:-translate-x-1/2">
          <div className="flex items-center justify-center gap-1 rounded-full bg-[#f8fafc] p-1 text-[#6b7280]">
            <HeaderTab icon="home" label="Home" active={activePage === "home"} />
            <HeaderTab
              icon="group"
              label="Friends"
              href="/friends"
              active={activePage === "friends"}
            />
            <HeaderTab
              icon="groups"
              label="Groups"
              href="/groups"
              active={activePage === "groups"}
            />
            <div className="relative" ref={messagesRef}>
              <HeaderTab
                icon="forum"
                label="Messages"
                as="button"
                active={activePage === "messages"}
                badge={unreadConversationCount}
                onClick={handleToggleMessages}
              />
              {messagesOpen ? (
                <MessagesDropdown
                  conversations={messageConversations}
                  loading={messagesLoading}
                  profile={profile}
                  onOpenMessages={() => navigate("/messages")}
                  onOpenConversation={openMiniConversation}
                />
              ) : null}
            </div>
          </div>
        </nav>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <div className="relative md:hidden" ref={mobileMessagesRef}>
            <IconButton
              icon="forum"
              label="Messages"
              onClick={handleToggleMessages}
              badge={unreadConversationCount}
            />
            {messagesOpen ? (
              <MessagesDropdown
                conversations={messageConversations}
                loading={messagesLoading}
                profile={profile}
                onOpenMessages={() => navigate("/messages")}
                onOpenConversation={openMiniConversation}
              />
            ) : null}
          </div>

          <div className="relative" ref={notificationsRef}>
            <IconButton
              icon="notifications"
              label="Notifications"
              onClick={handleToggleNotifications}
              badge={newNotificationCount}
            />
            {notificationsOpen ? (
              <NotificationsDropdown
                notifications={notifications}
                unreadCount={unreadCount}
                loading={notificationsLoading}
                onDeleteNotification={handleDeleteNotification}
                onMarkAllAsRead={handleMarkAllAsRead}
                onNotificationClick={handleNotificationClick}
              />
            ) : null}
          </div>

          <div className="relative" ref={profileMenuRef}>
            <button
              type="button"
              onClick={() => setProfileMenuOpen((open) => !open)}
              className="flex items-center gap-2 rounded-full px-1 py-1 hover:bg-[#f2f3f5]"
              aria-expanded={profileMenuOpen}
              aria-label="Open profile menu"
            >
              <UserAvatar
                image={profile?.avatar}
                name={profile?.fullName}
                size="sm"
              />
              <span className="hidden max-w-36 truncate text-sm font-semibold text-[#111827] xl:block">
                {profile?.fullName || "Hexa Pentania"}
              </span>
              <span className="material-symbols-outlined hidden text-[18px] text-[#111827] sm:inline">
                expand_more
              </span>
            </button>

            {profileMenuOpen ? (
              <ProfileMenu
                profile={profile}
                isLoggingOut={isLoggingOut}
                onLogout={handleLogout}
              />
            ) : null}
          </div>
        </div>
      </div>

      <UserSearchBox
        wrapperClassName="relative mt-3 block sm:hidden"
        shellClassName="flex h-10 items-center gap-2 rounded-full bg-[#f0f2f5] px-3 text-[#65676b]"
        inputClassName="min-w-0 flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-[#9ca3af]"
        dropdownClassName="absolute left-0 top-12 z-50 w-full rounded-lg border border-[#dddfe2] bg-white p-2 shadow-2xl"
      />

      {popupNotification ? (
        <NotificationPopup
          notification={popupNotification}
          onClose={() => setPopupNotification(null)}
        />
      ) : null}

      {miniConversation ? (
        <MiniChatWindow
          conversation={miniConversation}
          messages={miniMessages}
          loading={miniLoading}
          minimized={miniMinimized}
          hasUnread={miniHasUnread}
          messageText={miniMessageText}
          messagesEndRef={miniMessagesEndRef}
          messagesListRef={miniMessagesListRef}
          profile={profile}
          activeStickerPack={miniActiveStickerPack}
          hasMoreMessages={miniHasMoreMessages}
          loadingOlder={miniLoadingOlder}
          stickerPacks={miniStickerPacks}
          stickersOpen={miniStickersOpen}
          onChangeMessage={setMiniMessageText}
          onClose={closeMiniConversation}
          onLoadOlder={loadOlderMiniMessages}
          onMinimize={handleMiniMinimize}
          onRestore={handleMiniRestore}
          onSelectStickerPack={setMiniActiveStickerPack}
          onSendSticker={handleMiniSendSticker}
          onToggleStickers={() => setMiniStickersOpen((open) => !open)}
          onOpenFull={() =>
            navigate(`/messages?conversationId=${miniConversation._id}`)
          }
          onSendMessage={handleMiniSendMessage}
        />
      ) : null}
    </header>
    <div className="h-[117px] shrink-0 sm:h-[65px]" aria-hidden="true" />
    </>
  );
};

const headerTabClass = (active) =>
  `relative flex h-10 w-16 items-center justify-center rounded-full transition ${
      active
        ? "bg-white text-[#1877f2] shadow-sm"
        : "text-[#6b7280] hover:bg-white hover:text-[#1877f2]"
    }`;

const HeaderTab = ({
  icon,
  label,
  active = false,
  href = "/",
  as = "link",
  badge = 0,
  onClick,
}) => {
  const content = (
    <>
      <span className="material-symbols-outlined text-[24px]">{icon}</span>
      {badge > 0 ? (
        <span className="absolute right-2 top-1 min-w-4 rounded-full bg-red-500 px-1 text-center text-[10px] font-bold leading-4 text-white">
          {badge > 9 ? "9+" : badge}
        </span>
      ) : null}
    </>
  );

  if (as === "button") {
    return (
      <button
        type="button"
        onClick={onClick}
        className={headerTabClass(active)}
        title={label}
        aria-label={label}
      >
        {content}
      </button>
    );
  }

  return (
    <Link
      to={href}
      className={headerTabClass(active)}
      title={label}
      aria-label={label}
    >
      {content}
    </Link>
  );
};

export default HomeHeader;

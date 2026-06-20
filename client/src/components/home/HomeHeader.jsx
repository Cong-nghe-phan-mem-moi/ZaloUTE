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
  useClickOutside(notificationsRef, closeNotifications);
  useClickOutside(profileMenuRef, closeProfileMenu);

  return (
    <header className="sticky top-0 z-40 flex h-20 items-center justify-between gap-4 border-b border-[#e5e7eb] bg-white px-6 shadow-sm lg:px-12">
      <div className="flex items-center gap-5">
        <AppLogo />
        <UserSearchBox />
      </div>

      <nav className="hidden flex-1 items-center justify-center gap-8 text-[#6b7280] md:flex">
        <HeaderTab icon="home" active={activePage === "home"} />
        <HeaderTab icon="storefront" />
        <HeaderTab icon="smart_display" />
        <HeaderTab
          icon="groups"
          href="/groups"
          active={activePage === "groups"}
        />
      </nav>

      <div className="flex items-center gap-3">
        <div className="relative" ref={messagesRef}>
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
            <span className="hidden max-w-36 truncate text-sm font-semibold text-[#111827] sm:block">
              {profile?.fullName || "Hexa Pentania"}
            </span>
            <span className="material-symbols-outlined text-[18px] text-[#111827]">
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
  );
};

const HeaderTab = ({ icon, active = false, href = "/" }) => (
  <Link
    to={href}
    className={`flex h-14 w-20 items-center justify-center border-b-4 ${
      active
        ? "border-[#1877f2] text-[#1877f2]"
        : "border-transparent hover:text-[#1877f2]"
    }`}
  >
    <span className="material-symbols-outlined text-[24px]">{icon}</span>
  </Link>
);

export default HomeHeader;

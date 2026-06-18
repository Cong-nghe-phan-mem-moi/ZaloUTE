export const getChatWsUrl = (token) => {
  const encodedToken = encodeURIComponent(token);
  const isSecure = window.location.protocol === "https:";

  if (import.meta.env.DEV) {
    const apiOrigin =
      import.meta.env.VITE_API_ORIGIN ||
      `${window.location.protocol}//${window.location.hostname}:5000`;
    const wsOrigin = apiOrigin.replace(/^http/, isSecure ? "wss" : "ws");

    return `${wsOrigin}/api/chats/ws?token=${encodedToken}`;
  }

  const protocol = isSecure ? "wss" : "ws";
  return `${protocol}://${window.location.host}/api/chats/ws?token=${encodedToken}`;
};

export const getProfileId = (profile) =>
  profile?._id || profile?.id || profile?.userId;

export const getId = (value) => value?._id || value?.id || value;

export const hasUnreadLastMessage = (conversation, profileId) => {
  const lastMessage = conversation?.lastMessage;
  if (!lastMessage || !profileId) return false;

  const senderId = String(getId(lastMessage.senderId));
  const currentUserId = String(profileId);
  if (senderId === currentUserId) return false;

  return !(lastMessage.readBy || []).some(
    (reader) => String(getId(reader)) === currentUserId,
  );
};

const hasNewLastMessage = (conversation, profileId, chatSeenAt) => {
  const lastMessage = conversation?.lastMessage;
  if (!lastMessage || !profileId) return false;

  const senderId = String(getId(lastMessage.senderId));
  const currentUserId = String(profileId);
  if (senderId === currentUserId) return false;

  const hasRead = (lastMessage.readBy || []).some(
    (reader) => String(getId(reader)) === currentUserId,
  );
  if (hasRead) return false;

  const seenAt = chatSeenAt ? new Date(chatSeenAt).getTime() : 0;
  return new Date(lastMessage.createdAt).getTime() > seenAt;
};

export const countNewConversations = (conversations, profileId, chatSeenAt) =>
  (conversations || []).filter((conversation) =>
    hasNewLastMessage(conversation, profileId, chatSeenAt),
  ).length;

export const getConversationTitle = (conversation, profile) => {
  if (conversation?.isGroup) {
    return conversation.name || "Group chat";
  }

  const profileId = String(getProfileId(profile) || "");
  const partner = conversation?.participants?.find(
    (participant) => String(getId(participant)) !== profileId,
  );

  return partner?.fullName || "Conversation";
};

export const getConversationAvatar = (conversation, profile) => {
  if (conversation?.isGroup) {
    return conversation.avatar;
  }

  const profileId = String(getProfileId(profile) || "");
  const partner = conversation?.participants?.find(
    (participant) => String(getId(participant)) !== profileId,
  );

  return partner?.avatar || null;
};

export const getConversationPreview = (conversation, profile) => {
  const lastMessage = conversation?.lastMessage;
  if (!lastMessage) return "No messages yet";
  if (lastMessage.isRevoked) return "Message has been unsent";

  const profileId = String(getProfileId(profile) || "");
  const senderId = String(getId(lastMessage.senderId));
  const prefix = senderId === profileId ? "You: " : "";

  if (lastMessage.messageType === "post_share") {
    return `${prefix}Shared a post`;
  }

  if (lastMessage.messageType === "story_reply") {
    return `${prefix}Replied to a story`;
  }

  if (lastMessage.messageType === "sticker") {
    return `${prefix}Sent a sticker`;
  }

  return `${prefix}${lastMessage.content || "Message"}`;
};

export const getMiniMessageContent = (message) => {
  if (message.isRevoked) return "Message has been unsent";
  if (message.messageType === "post_share") {
    return message.content || "Shared a post";
  }
  if (message.messageType === "story_reply") {
    return message.content || "Replied to a story";
  }
  if (message.messageType === "sticker") return "Sent a sticker";
  if (message.messageType === "system") return message.content || "System message";
  return message.content || "Message";
};

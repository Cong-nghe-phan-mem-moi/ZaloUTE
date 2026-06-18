import { useCallback, useEffect, useRef, useState } from "react";
import { chatAPI } from "../../services/chat.service";
import {
  countNewConversations,
  getChatWsUrl,
  getId,
  getProfileId,
} from "../../utils/chatUtils";

const MINI_MESSAGE_PAGE_SIZE = 25;

export const useHeaderChat = (profile) => {
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [messageConversations, setMessageConversations] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [unreadConversationCount, setUnreadConversationCount] = useState(0);
  const [chatSeenAt, setChatSeenAt] = useState(null);
  const [miniConversation, setMiniConversation] = useState(null);
  const [miniMessages, setMiniMessages] = useState([]);
  const [miniLoading, setMiniLoading] = useState(false);
  const [miniLoadingOlder, setMiniLoadingOlder] = useState(false);
  const [miniMessagePage, setMiniMessagePage] = useState(1);
  const [miniHasMoreMessages, setMiniHasMoreMessages] = useState(false);
  const [miniMessageText, setMiniMessageText] = useState("");
  const [miniMinimized, setMiniMinimized] = useState(false);
  const [miniHasUnread, setMiniHasUnread] = useState(false);
  const chatSocketRef = useRef(null);
  const miniConversationIdRef = useRef(null);
  const miniMinimizedRef = useRef(false);
  const miniMessagesListRef = useRef(null);
  const miniMessagesEndRef = useRef(null);
  const miniShouldStickBottomRef = useRef(true);

  const closeMessages = useCallback(() => setMessagesOpen(false), []);

  const sendMiniReadReceipt = useCallback((conversationId) => {
    const socket = chatSocketRef.current;
    if (!conversationId || socket?.readyState !== WebSocket.OPEN) return;

    socket.send(
      JSON.stringify({
        type: "read_receipt",
        conversationId,
      }),
    );
  }, []);

  const markConversationReadLocally = useCallback((conversationId) => {
    const profileId = getProfileId(profile);
    if (!conversationId || !profileId) return;

    setMessageConversations((items) => {
      const nextItems = items.map((conversation) => {
        if (conversation._id !== conversationId || !conversation.lastMessage) {
          return conversation;
        }

        const readBy = conversation.lastMessage.readBy || [];
        const alreadyRead = readBy.some(
          (reader) => String(getId(reader)) === String(profileId),
        );

        if (alreadyRead) return conversation;

        return {
          ...conversation,
          lastMessage: {
            ...conversation.lastMessage,
            readBy: [...readBy, profileId],
          },
        };
      });

      setUnreadConversationCount(
        countNewConversations(nextItems, profileId, chatSeenAt),
      );
      return nextItems;
    });
  }, [chatSeenAt, profile]);

  const loadUnreadConversations = useCallback(async () => {
    const profileId = getProfileId(profile);
    if (!profileId) {
      setUnreadConversationCount(0);
      return [];
    }

    try {
      setMessagesLoading(true);
      const [conversationResponse, badgeResponse] = await Promise.all([
        chatAPI.getConversations(),
        chatAPI.getConversationBadge(),
      ]);
      const conversations = conversationResponse.data?.data || [];
      const nextChatSeenAt = badgeResponse.data?.data?.chatSeenAt || null;
      const nextBadgeCount =
        badgeResponse.data?.data?.count ??
        countNewConversations(conversations, profileId, nextChatSeenAt);

      setMessageConversations(conversations);
      setChatSeenAt(nextChatSeenAt);
      setUnreadConversationCount(nextBadgeCount);
      return conversations;
    } catch (error) {
      console.error("Unable to load message badge:", error);
      setUnreadConversationCount(0);
      return [];
    } finally {
      setMessagesLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadUnreadConversations();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadUnreadConversations]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const profileId = getProfileId(profile);
    if (!token || !profileId) return undefined;

    const wsUrl = getChatWsUrl(token);
    let socket = null;
    let reconnectTimer = null;
    let shouldReconnect = true;
    let hasConnected = false;
    let conversationsCache = [];

    const updateUnreadCount = () => {
      setUnreadConversationCount(
        countNewConversations(conversationsCache, profileId, chatSeenAt),
      );
    };
    const markCachedConversationRead = (conversationId) => {
      conversationsCache = conversationsCache.map((conversation) => {
        if (conversation._id !== conversationId || !conversation.lastMessage) {
          return conversation;
        }

        const readBy = conversation.lastMessage.readBy || [];
        const alreadyRead = readBy.some(
          (reader) => String(getId(reader)) === String(profileId),
        );

        if (alreadyRead) return conversation;

        return {
          ...conversation,
          lastMessage: {
            ...conversation.lastMessage,
            readBy: [...readBy, profileId],
          },
        };
      });
    };

    const connect = () => {
      socket = new WebSocket(wsUrl);
      socket.onopen = async () => {
        hasConnected = true;
        chatSocketRef.current = socket;
        conversationsCache = await loadUnreadConversations();
        if (miniConversationIdRef.current && !miniMinimizedRef.current) {
          sendMiniReadReceipt(miniConversationIdRef.current);
        }
      };
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "message" && data.data) {
            const message = data.data;
            const isActiveMiniChat =
              message.conversationId === miniConversationIdRef.current;
            const isMiniReadable =
              isActiveMiniChat && !miniMinimizedRef.current;

            if (isActiveMiniChat) {
              miniShouldStickBottomRef.current = !miniMinimizedRef.current;
              setMiniMessages((items) =>
                items.some((item) => item._id === message._id)
                  ? items
                  : [...items, message],
              );

              if (miniMinimizedRef.current) {
                const senderId = String(getId(message.senderId));
                if (senderId !== String(profileId)) {
                  setMiniHasUnread(true);
                }
              }
            }

            if (isMiniReadable) {
              markCachedConversationRead(message.conversationId);
              sendMiniReadReceipt(message.conversationId);
              markConversationReadLocally(message.conversationId);
            }
          }

          if (data.type === "conversation_update" && data.data?._id) {
            const nextConversation = data.data;
            const exists = conversationsCache.some(
              (conversation) => conversation._id === nextConversation._id,
            );

            conversationsCache = exists
              ? conversationsCache.map((conversation) =>
                  conversation._id === nextConversation._id
                    ? { ...conversation, ...nextConversation }
                    : conversation,
                )
              : [nextConversation, ...conversationsCache];
            setMessageConversations(conversationsCache);
            const isActiveMiniChat =
              nextConversation._id === miniConversationIdRef.current;
            const isMiniReadable =
              isActiveMiniChat && !miniMinimizedRef.current;

            if (isActiveMiniChat) {
              setMiniConversation(nextConversation);
            }

            if (isMiniReadable) {
              markCachedConversationRead(nextConversation._id);
              markConversationReadLocally(nextConversation._id);
              sendMiniReadReceipt(nextConversation._id);
            } else {
              updateUnreadCount();
            }
          }

          if (data.type === "conversation_remove" && data.conversationId) {
            conversationsCache = conversationsCache.filter(
              (conversation) => conversation._id !== data.conversationId,
            );
            setMessageConversations(conversationsCache);
            updateUnreadCount();
          }

          if (data.type === "message_badge_seen") {
            setChatSeenAt(data.chatSeenAt || new Date().toISOString());
            setUnreadConversationCount(data.unreadConversationCount || 0);
          }
        } catch (error) {
          console.error("Invalid chat badge message:", error);
        }
      };
      socket.onerror = (error) => {
        if (hasConnected) {
          console.error("Chat badge websocket error:", error);
        }
      };
      socket.onclose = (event) => {
        if (event.code === 1008 || !hasConnected) {
          shouldReconnect = false;
          return;
        }

        if (!shouldReconnect) return;
        reconnectTimer = window.setTimeout(connect, 3000);
      };
    };

    loadUnreadConversations()
      .then((conversations) => {
        conversationsCache = conversations;
        setMessageConversations(conversationsCache);

        if (shouldReconnect) {
          connect();
        }
      })
      .catch((error) => {
        shouldReconnect = false;
        console.error("Unable to start chat badge websocket:", error);
      });

    return () => {
      shouldReconnect = false;
      if (reconnectTimer) {
        window.clearTimeout(reconnectTimer);
      }
      socket?.close();
      if (chatSocketRef.current === socket) {
        chatSocketRef.current = null;
      }
    };
  }, [
    chatSeenAt,
    loadUnreadConversations,
    markConversationReadLocally,
    profile,
    sendMiniReadReceipt,
  ]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        loadUnreadConversations();
      }
    }, 15000);

    return () => window.clearInterval(interval);
  }, [loadUnreadConversations]);

  useEffect(() => {
    miniMinimizedRef.current = miniMinimized;
  }, [miniMinimized]);

  const handleToggleMessages = async () => {
    const nextOpen = !messagesOpen;
    setMessagesOpen(nextOpen);

    if (nextOpen) {
      const conversations = await loadUnreadConversations();

      try {
        const response = await chatAPI.markConversationsAsSeen();
        const nextData = response.data?.data || {};
        setMessageConversations(nextData.conversations || conversations);
        setChatSeenAt(nextData.chatSeenAt || new Date().toISOString());
        setUnreadConversationCount(0);
      } catch (error) {
        console.error("Unable to mark message badge as seen:", error);
        setChatSeenAt(new Date().toISOString());
        setUnreadConversationCount(0);
      }
    }
  };

  const openMiniConversation = useCallback(async (target) => {
    let conversation = target;

    if (!conversation?.participants) {
      const targetUserId = target?.id || target?._id || target?.userId;
      if (!targetUserId) return;

      try {
        const response = await chatAPI.getOrCreateConversation(targetUserId);
        conversation = response.data?.data;
      } catch (error) {
        console.error("Unable to open mini chat:", error);
        return;
      }
    }

    if (!conversation?._id) return;

    setMessagesOpen(false);
    setMiniConversation(conversation);
    setMiniMinimized(false);
    miniMinimizedRef.current = false;
    setMiniHasUnread(false);
    setMiniMessages([]);
    setMiniLoading(true);
    setMiniLoadingOlder(false);
    setMiniMessagePage(1);
    setMiniHasMoreMessages(false);
    miniShouldStickBottomRef.current = true;
    miniConversationIdRef.current = conversation._id;
    setMessageConversations((items) => {
      const exists = items.some((item) => item._id === conversation._id);
      return exists
        ? items.map((item) =>
            item._id === conversation._id ? { ...item, ...conversation } : item,
          )
        : [conversation, ...items];
    });
    markConversationReadLocally(conversation._id);
    sendMiniReadReceipt(conversation._id);

    try {
      const response = await chatAPI.getMessages(
        conversation._id,
        1,
        MINI_MESSAGE_PAGE_SIZE,
      );
      const messages = response.data?.data || [];
      setMiniMessages(messages);
      setMiniHasMoreMessages(messages.length === MINI_MESSAGE_PAGE_SIZE);
      sendMiniReadReceipt(conversation._id);
      markConversationReadLocally(conversation._id);
    } catch (error) {
      console.error("Unable to load mini chat:", error);
      setMiniMessages([]);
    } finally {
      setMiniLoading(false);
    }
  }, [markConversationReadLocally, sendMiniReadReceipt]);

  const loadOlderMiniMessages = useCallback(async () => {
    if (
      !miniConversation?._id ||
      miniLoading ||
      miniLoadingOlder ||
      !miniHasMoreMessages
    ) {
      return;
    }

    const listElement = miniMessagesListRef.current;
    const previousScrollHeight = listElement?.scrollHeight || 0;
    const previousScrollTop = listElement?.scrollTop || 0;
    const nextPage = miniMessagePage + 1;

    setMiniLoadingOlder(true);
    miniShouldStickBottomRef.current = false;

    try {
      const response = await chatAPI.getMessages(
        miniConversation._id,
        nextPage,
        MINI_MESSAGE_PAGE_SIZE,
      );
      const olderMessages = response.data?.data || [];

      setMiniMessages((items) => {
        const existingIds = new Set(items.map((item) => item._id));
        const uniqueOlderMessages = olderMessages.filter(
          (message) => !existingIds.has(message._id),
        );
        return [...uniqueOlderMessages, ...items];
      });
      setMiniMessagePage(nextPage);
      setMiniHasMoreMessages(olderMessages.length === MINI_MESSAGE_PAGE_SIZE);

      window.requestAnimationFrame(() => {
        if (!listElement) return;
        const nextScrollHeight = listElement.scrollHeight;
        listElement.scrollTop =
          nextScrollHeight - previousScrollHeight + previousScrollTop;
      });
    } catch (error) {
      console.error("Unable to load older mini chat messages:", error);
    } finally {
      setMiniLoadingOlder(false);
    }
  }, [
    miniConversation,
    miniHasMoreMessages,
    miniLoading,
    miniLoadingOlder,
    miniMessagePage,
  ]);

  useEffect(() => {
    const handleOpenMiniChat = (event) => {
      openMiniConversation(event.detail);
    };

    window.addEventListener("zalo-open-mini-chat", handleOpenMiniChat);
    return () => {
      window.removeEventListener("zalo-open-mini-chat", handleOpenMiniChat);
    };
  }, [openMiniConversation]);

  const closeMiniConversation = () => {
    setMiniConversation(null);
    setMiniMessages([]);
    setMiniMessageText("");
    setMiniLoadingOlder(false);
    setMiniMessagePage(1);
    setMiniHasMoreMessages(false);
    setMiniMinimized(false);
    setMiniHasUnread(false);
    miniMinimizedRef.current = false;
    miniConversationIdRef.current = null;
  };

  const handleMiniMinimize = () => {
    miniMinimizedRef.current = true;
    setMiniMinimized(true);
  };

  const handleMiniRestore = () => {
    miniMinimizedRef.current = false;
    miniShouldStickBottomRef.current = true;
    setMiniMinimized(false);
    setMiniHasUnread(false);

    if (!miniConversation?._id) return;
    sendMiniReadReceipt(miniConversation._id);
    markConversationReadLocally(miniConversation._id);
  };

  const handleMiniSendMessage = (event) => {
    event.preventDefault();

    const socket = chatSocketRef.current;
    if (
      !miniMessageText.trim() ||
      !miniConversation?._id ||
      socket?.readyState !== WebSocket.OPEN
    ) {
      return;
    }

    socket.send(
      JSON.stringify({
        type: "send_message",
        conversationId: miniConversation._id,
        content: miniMessageText.trim(),
        messageType: "text",
      }),
    );
    setMiniMessageText("");
  };

  useEffect(() => {
    if (!miniMinimized && miniShouldStickBottomRef.current) {
      miniMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [miniMessages, miniMinimized]);

  return {
    messagesOpen,
    messageConversations,
    messagesLoading,
    unreadConversationCount,
    miniConversation,
    miniMessages,
    miniLoading,
    miniLoadingOlder,
    miniHasMoreMessages,
    miniMessageText,
    miniMinimized,
    miniHasUnread,
    miniMessagesListRef,
    miniMessagesEndRef,
    closeMessages,
    handleMiniMinimize,
    handleMiniRestore,
    handleMiniSendMessage,
    handleToggleMessages,
    loadOlderMiniMessages,
    openMiniConversation,
    closeMiniConversation,
    setMiniMessageText,
  };
};

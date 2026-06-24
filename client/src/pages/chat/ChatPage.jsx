import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { format, formatDistanceToNow } from "date-fns";
import { enUS } from "date-fns/locale";
import HomeHeader from "../../components/home/HomeHeader";
import RightSidebar from "../../components/home/RightSidebar";
import UserAvatar from "../../components/common/UserAvatar";
import SharedPostPreview from "../../components/post/SharedPostPreview";
import getImageUrl, { getImageFallbackUrl } from "../../utils/imageUrl";
import {
  AddMembersModal,
  ConfirmModal,
  CreateGroupModal,
  GroupSidebar,
} from "../../components/chat";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { fetchUserProfile, updateFriendStatus } from "../../redux/slices/userSlice";
import {
  fetchConversations,
  selectConversationAndFetchMessages,
  getOrCreateConversationAndSelect,
  addReceivedMessage,
  updateConversationListItem,
  setTypingStatus,
  createGroup,
  removeGroupMember,
  leaveGroup,
  removeConversationFromList,
  addGroupMembers,
  updateMessage,
  muteConversation,
  unmuteConversation,
  blockConversation,
  unblockConversation,
  deleteConversation,
  updateParticipantStatus,
} from "../../redux/slices/chatSlice";
import { chatAPI } from "../../services/chat.service";
import { stickerAPI } from "../../services/sticker.service";
import { getConversationPreview } from "../../utils/chatUtils";

const MESSAGE_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "😡"];

const getChatWsUrl = (token) => {
  const encodedToken = encodeURIComponent(token);
  const isSecure = window.location.protocol === "https:";

  if (import.meta.env.DEV) {
    const apiOrigin = import.meta.env.VITE_API_ORIGIN || window.location.origin;
    const wsOrigin = apiOrigin.replace(/^http/, isSecure ? "wss" : "ws");

    return `${wsOrigin}/api/chats/ws?token=${encodedToken}`;
  }

  const protocol = isSecure ? "wss" : "ws";
  return `${protocol}://${window.location.host}/api/chats/ws?token=${encodedToken}`;
};

const formatLastActive = (lastActive) => {
  if (!lastActive) return "Offline";
  try {
    const timeDistance = formatDistanceToNow(new Date(lastActive), { addSuffix: true, locale: enUS });
    return `Active ${timeDistance}`;
  } catch {
    return "Offline";
  }
};

const StoryReplyPreview = ({ story, onOpen }) => {
  if (!story) {
    return (
      <div className="mt-2 rounded-xl border border-white/20 bg-black/10 p-3 text-xs">
        Story is no longer available.
      </div>
    );
  }

  const mediaUrl = story.media?.url ? getImageUrl(story.media.url) : null;

  return (
    <button
      type="button"
      onClick={() => onOpen?.(story._id)}
      className="mt-2 flex w-full max-w-xs items-center gap-3 rounded-xl border border-gray-200 bg-white p-2 text-left text-gray-900 hover:bg-gray-50"
    >
      <div
        className="flex h-16 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg text-center text-[10px] font-bold text-white"
        style={{ background: mediaUrl ? "#111827" : story.background || "#1877f2" }}
      >
        {mediaUrl ? (
          story.type === "video" ? (
            <video className="h-full w-full object-cover" src={mediaUrl} muted />
          ) : (
            <img className="h-full w-full object-cover" src={mediaUrl} alt="" />
          )
        ) : (
          <span className="line-clamp-3 px-1">{story.text || "Story"}</span>
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs font-bold">
          {story.author?.fullName || "Story"}
        </p>
        <p className="line-clamp-2 text-xs text-gray-500">
          {story.text || (story.media ? "Story media" : "Story")}
        </p>
      </div>
    </button>
  );
};

const ChatPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { profile } = useAppSelector((state) => state.user);
  const {
    conversations,
    activeConversation,
    messages,
    typingUsers,
    loadingConversations,
    loadingMessages,
  } = useAppSelector((state) => state.chat);

  const [messageText, setMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [socket, setSocket] = useState(null);
  const [typingState, setTypingState] = useState(false);
  const [stickerPacks, setStickerPacks] = useState([]);
  const [stickersOpen, setStickersOpen] = useState(false);
  const [activeStickerPack, setActiveStickerPack] = useState(0);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [pendingImages, setPendingImages] = useState([]);
  const typingTimeoutRef = useRef(null);
  const messageEndRef = useRef(null);
  const inputRef = useRef(null);
  const imageInputRef = useRef(null);
  const pendingImagesRef = useRef([]);

  const [replyingMessage, setReplyingMessage] = useState(null);
  const [activeMenuMessageId, setActiveMenuMessageId] = useState(null);

  // States for mentioning/tagging group members
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [tagSearchQuery, setTagSearchQuery] = useState("");
  const [tagTriggerIndex, setTagTriggerIndex] = useState(-1);
  const [selectedTagIndex, setSelectedTagIndex] = useState(0);
  const [mentionedUsers, setMentionedUsers] = useState([]);

  // States for conversation action dropdown menus
  const [activeMenuConvId, setActiveMenuConvId] = useState(null);
  const [showMuteSubmenu, setShowMuteSubmenu] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();
  const queryConversationId = searchParams.get("conversationId");
  const activeConversationId = activeConversation?._id;

  // Click outside message action menu to close it
  useEffect(() => {
    const handleOutsideClick = () => {
      setActiveMenuMessageId(null);
      setActiveMenuConvId(null);
      setShowMuteSubmenu(false);
    };
    document.addEventListener("click", handleOutsideClick);
    return () => {
      document.removeEventListener("click", handleOutsideClick);
    };
  }, []);

  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isAddMembersOpen, setIsAddMembersOpen] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
    confirmBtnText: "",
    isDanger: false,
  });

  useEffect(() => {
    pendingImagesRef.current = pendingImages;
  }, [pendingImages]);

  useEffect(() => {
    return () => {
      pendingImagesRef.current.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    };
  }, []);

  const handleCreateGroup = (name, participantIds) => {
    dispatch(createGroup({ name, participantIds }))
      .unwrap()
      .then(() => {
        setIsCreateGroupOpen(false);
      })
      .catch((err) => {
        alert(err || "Error creating group");
      });
  };

  const handleAddMembers = (participantIds) => {
    if (!activeConversation) return;
    dispatch(addGroupMembers({ conversationId: activeConversation._id, participantIds }))
      .unwrap()
      .then(() => {
        setIsAddMembersOpen(false);
      })
      .catch((err) => {
        alert(err || "Error adding member");
      });
  };

  const handleRemoveMember = (memberId) => {
    if (!activeConversation) return;
    setConfirmModal({
      isOpen: true,
      title: "Remove member",
      message: "Are you sure you want to remove this member from the group?",
      confirmBtnText: "Remove",
      isDanger: true,
      onConfirm: () => {
        dispatch(removeGroupMember({ conversationId: activeConversation._id, memberId }))
          .unwrap()
          .then(() => {
            setConfirmModal(prev => ({ ...prev, isOpen: false }));
          })
          .catch((err) => {
            alert(err || "Error removing member");
          });
      }
    });
  };

  const handleLeaveGroup = () => {
    if (!activeConversation) return;
    setConfirmModal({
      isOpen: true,
      title: "Leave group",
      message: "Are you sure you want to leave this group?",
      confirmBtnText: "Leave group",
      isDanger: true,
      onConfirm: () => {
        dispatch(leaveGroup(activeConversation._id))
          .unwrap()
          .then(() => {
            setShowGroupInfo(false);
            setConfirmModal(prev => ({ ...prev, isOpen: false }));
          })
          .catch((err) => {
            alert(err || "Error leaving group");
          });
      }
    });
  };

  const handleMuteConversation = (conversationId, duration) => {
    dispatch(muteConversation({ conversationId, duration }))
      .unwrap()
      .then(() => {
        setActiveMenuConvId(null);
        setShowMuteSubmenu(false);
      })
      .catch((err) => {
        alert(err || "Error muting notifications");
      });
  };

  const handleUnmuteConversation = (conversationId) => {
    dispatch(unmuteConversation(conversationId))
      .unwrap()
      .then(() => {
        setActiveMenuConvId(null);
      })
      .catch((err) => {
        alert(err || "Error unmuting notifications");
      });
  };

  const handleBlockConversation = (conversationId) => {
    dispatch(blockConversation(conversationId))
      .unwrap()
      .then(() => {
        setActiveMenuConvId(null);
      })
      .catch((err) => {
        alert(err || "Error blocking user");
      });
  };

  const handleUnblockConversation = (conversationId) => {
    dispatch(unblockConversation(conversationId))
      .unwrap()
      .then(() => {
        setActiveMenuConvId(null);
      })
      .catch((err) => {
        alert(err || "Error unblocking user");
      });
  };

  const handleDeleteConversation = (conversationId) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete conversation",
      message: "Are you sure you want to delete this conversation? All message history will be deleted for you.",
      confirmBtnText: "Delete",
      isDanger: true,
      onConfirm: () => {
        dispatch(deleteConversation(conversationId))
          .unwrap()
          .then(() => {
            setConfirmModal(prev => ({ ...prev, isOpen: false }));
            setActiveMenuConvId(null);
          })
          .catch((err) => {
            alert(err || "Error deleting conversation");
          });
      }
    });
  };

  useEffect(() => {
    dispatch(fetchUserProfile());
    dispatch(fetchConversations());
  }, [dispatch]);

  useEffect(() => {
    let isCurrent = true;

    stickerAPI
      .getStickerPacks()
      .then((response) => {
        if (!isCurrent) return;
        setStickerPacks(response.data?.data || []);
      })
      .catch((error) => {
        console.error("Unable to load sticker packs:", error);
        if (isCurrent) setStickerPacks([]);
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  useEffect(() => {
    if (queryConversationId && conversations.length > 0) {
      const targetConv = conversations.find(
        (c) => c._id.toString() === queryConversationId.toString()
      );
      if (targetConv) {
        dispatch(selectConversationAndFetchMessages(targetConv));

        searchParams.delete("conversationId");
        setSearchParams(searchParams);
      }
    }
  }, [queryConversationId, conversations, dispatch, searchParams, setSearchParams]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    clearPendingImages();
  }, [activeConversationId]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return undefined;

    const wsUrl = getChatWsUrl(token);
    let ws = null;
    let reconnectTimer = null;
    let shouldReconnect = true;

    const connect = () => {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log("Chat websocket connected");
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          const { type } = payload;

          if (type === "message") {
            dispatch(addReceivedMessage(payload.data));

            if (activeConversationId === payload.data.conversationId) {
              ws.send(
                JSON.stringify({
                  type: "read_receipt",
                  conversationId: activeConversationId,
                })
              );
            }
          } else if (type === "message_update") {
            dispatch(updateMessage(payload.data));
          } else if (type === "conversation_update") {
            dispatch(updateConversationListItem(payload.data));
          } else if (type === "user_status_change") {
            const { userId, isOnline, lastActive } = payload.data;
            dispatch(updateParticipantStatus({ userId, isOnline, lastActive }));
            dispatch(updateFriendStatus({ userId, isOnline, lastActive }));
          } else if (type === "conversation_remove") {
            dispatch(removeConversationFromList(payload.conversationId));
          } else if (type === "typing") {
            const { conversationId, userId, isTyping } = payload;
            dispatch(setTypingStatus({ conversationId, userId, isTyping }));
          } else if (type === "error") {
            const { conversationId, message } = payload;
            dispatch(
              addReceivedMessage({
                _id: "error-" + Date.now(),
                conversationId: conversationId || activeConversationId,
                senderId: { _id: "system", fullName: "System" },
                content: message,
                messageType: "system",
                createdAt: new Date().toISOString(),
              })
            );
          }
        } catch (error) {
          console.error("Error parsing websocket message:", error);
        }
      };

      ws.onclose = (event) => {
        console.log("Chat websocket disconnected", {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
        });
        if (shouldReconnect) {
          reconnectTimer = window.setTimeout(connect, 3000);
        }
      };

      ws.onerror = (error) => {
        console.error("Chat websocket error:", error);
      };

      setSocket(ws);
    };

    connect();

    return () => {
      shouldReconnect = false;
      if (reconnectTimer) {
        window.clearTimeout(reconnectTimer);
      }
      ws?.close();
    };
  }, [dispatch, activeConversationId]);

  useEffect(() => {
    if (
      socket &&
      socket.readyState === WebSocket.OPEN &&
      activeConversationId
    ) {
      socket.send(
        JSON.stringify({
          type: "read_receipt",
          conversationId: activeConversationId,
        })
      );
    }
  }, [activeConversationId, socket, messages.length]);

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (pendingImages.length > 0) {
      if (messageText.trim()) {
        sendTextMessage();
      }

      const failedImages = [];

      for (const image of pendingImages) {
        const sent = await uploadAndSendImage(image.file);
        if (sent) {
          URL.revokeObjectURL(image.previewUrl);
        } else {
          failedImages.push(image);
        }
      }

      setPendingImages(failedImages);
      return;
    }

    sendTextMessage();
  };

  const handleSendSticker = (sticker) => {
    if (
      !sticker?.imageUrl ||
      !activeConversation ||
      !socket ||
      socket.readyState !== WebSocket.OPEN
    ) {
      return;
    }

    socket.send(
      JSON.stringify({
        type: "send_message",
        conversationId: activeConversation._id,
        content: sticker.imageUrl,
        messageType: "sticker",
      }),
    );
    setStickersOpen(false);
  };

  const uploadAndSendImage = async (file) => {
    if (!file || !activeConversation || !socket || socket.readyState !== WebSocket.OPEN) {
      return false;
    }

    if (!file.type.startsWith("image/")) {
      alert("Please choose an image file.");
      return false;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert("Image must be 10MB or smaller.");
      return false;
    }

    try {
      setIsUploadingImage(true);
      const response = await chatAPI.uploadConversationImage(activeConversation._id, file);
      const imageUrl = response.data?.data?.url;

      if (!imageUrl) {
        throw new Error("Upload completed without an image URL");
      }

      const payload = {
        type: "send_message",
        conversationId: activeConversation._id,
        content: imageUrl,
        messageType: "image",
      };

      if (replyingMessage) {
        payload.replyTo = replyingMessage._id;
      }

      socket.send(JSON.stringify(payload));
      setReplyingMessage(null);
      return true;
    } catch (error) {
      alert(error.response?.data?.message || error.message || "Unable to upload image");
      return false;
    } finally {
      setIsUploadingImage(false);
    }
  };

  const addPendingImageFiles = (files) => {
    const selectedFiles = Array.from(files || []);
    if (selectedFiles.length === 0) return;

    const validImages = [];

    selectedFiles.forEach((file) => {
      if (!file.type.startsWith("image/")) {
        alert("Please choose image files only.");
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        alert(`${file.name || "Image"} must be 10MB or smaller.`);
        return;
      }

      validImages.push({
        id: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`,
        file,
        previewUrl: URL.createObjectURL(file),
      });
    });

    if (validImages.length === 0) return;

    setPendingImages((currentImages) => [...currentImages, ...validImages]);
    setStickersOpen(false);
  };

  const handleSendImage = (event) => {
    const files = event.target.files;
    event.target.value = "";
    addPendingImageFiles(files);
  };

  const handlePasteImage = (event) => {
    if (isUploadingImage) return;

    const imageFiles = Array.from(event.clipboardData?.items || [])
      .filter((item) => item.type.startsWith("image/"))
      .map((item) => item.getAsFile())
      .filter(Boolean);

    if (imageFiles.length === 0) return;

    event.preventDefault();
    addPendingImageFiles(imageFiles);
  };

  const sendTextMessage = () => {
    if (
      !messageText.trim() ||
      !activeConversation ||
      !socket ||
      socket.readyState !== WebSocket.OPEN
    ) {
      return false;
    }

    const activeMentions = mentionedUsers.filter((u) =>
      messageText.includes(`@${u.fullName}`)
    );
    const mentions = activeMentions.map((u) => u.id);

    const payload = {
      type: "send_message",
      conversationId: activeConversation._id,
      content: messageText.trim(),
      messageType: "text",
      mentions: mentions,
    };

    if (replyingMessage) {
      payload.replyTo = replyingMessage._id;
    }

    socket.send(JSON.stringify(payload));
    setMessageText("");
    setReplyingMessage(null);
    setMentionedUsers([]);

    if (typingState) {
      socket.send(
        JSON.stringify({
          type: "typing",
          conversationId: activeConversation._id,
          isTyping: false,
        })
      );
      setTypingState(false);
    }

    return true;
  };

  const removePendingImage = (imageId) => {
    setPendingImages((currentImages) => {
      const imageToRemove = currentImages.find((image) => image.id === imageId);
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.previewUrl);
      }

      return currentImages.filter((image) => image.id !== imageId);
    });
  };

  const clearPendingImages = () => {
    pendingImagesRef.current.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    setPendingImages([]);
  };

  const handleRevokeMessage = (msg) => {
    if (!socket || socket.readyState !== WebSocket.OPEN || !activeConversation) return;

    socket.send(
      JSON.stringify({
        type: "revoke_message",
        conversationId: activeConversation._id,
        messageId: msg._id,
      })
    );
  };

  const handleReactMessage = (msg, emoji) => {
    if (!msg?._id || !socket || socket.readyState !== WebSocket.OPEN || !activeConversation) return;

    socket.send(
      JSON.stringify({
        type: "react_message",
        conversationId: activeConversation._id,
        messageId: msg._id,
        emoji,
      })
    );
    setActiveMenuMessageId(null);
  };

  const handleKeyDown = (e) => {
    if (showTagDropdown && filteredMembersForTag.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedTagIndex((prev) => (prev + 1) % filteredMembersForTag.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedTagIndex((prev) => (prev - 1 + filteredMembersForTag.length) % filteredMembersForTag.length);
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        handleSelectTagMember(filteredMembersForTag[selectedTagIndex]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setShowTagDropdown(false);
        return;
      }
    }

    if (!socket || !activeConversation || socket.readyState !== WebSocket.OPEN)
      return;

    if (!typingState) {
      setTypingState(true);
      socket.send(
        JSON.stringify({
          type: "typing",
          conversationId: activeConversation._id,
          isTyping: true,
        })
      );
    }

    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = window.setTimeout(() => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(
          JSON.stringify({
            type: "typing",
            conversationId: activeConversation._id,
            isTyping: false,
          })
        );
      }
      setTypingState(false);
    }, 2500);
  };

  const getChatPartner = (conversation) => {
    if (!conversation || !profile) return { fullName: "Chat", avatar: null, isOnline: false };
    if (conversation.isGroup) {
      return {
        fullName: conversation.name || "Group Chat",
        avatar: conversation.avatar,
        isOnline: false,
      };
    }
    const partner = conversation.participants.find(
      (p) => p._id.toString() !== (profile.id || profile.userId || "").toString()
    );
    return partner || { fullName: "ZaloUTE User", avatar: null, isOnline: false };
  };

  const renderMessageContent = (content, mentionsList, isMe) => {
    if (!content) return "";

    const mentions = mentionsList || [];
    const validMentions = mentions
      .filter((m) => m && m.fullName)
      .sort((a, b) => b.fullName.length - a.fullName.length);

    const escapeRegex = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const patterns = ["@All"];
    validMentions.forEach((m) => {
      patterns.push(`@${escapeRegex(m.fullName)}`);
    });

    const regex = new RegExp(`(${patterns.join("|")})`, "g");
    const parts = content.split(regex);

    return parts.map((part, idx) => {
      if (part === "@All") {
        return (
          <span
            key={idx}
            className={`font-bold ${
              isMe ? "text-amber-200" : "text-amber-600"
            }`}
          >
            {part}
          </span>
        );
      }

      if (part.startsWith("@")) {
        const name = part.slice(1);
        const mentioned = validMentions.find((m) => m.fullName === name);
        if (mentioned) {
          return (
            <span
              key={idx}
              className={`font-semibold ${
                isMe ? "text-blue-100 underline decoration-dotted" : "text-[#1877f2] font-bold"
              }`}
            >
              {part}
            </span>
          );
        }
      }

      return part;
    });
  };

  const getMessagePreviewText = (message) => {
    if (!message) return "";
    if (message.isRevoked) return "Message has been unsent";
    if (message.messageType === "image") return "Sent an image";
    if (message.messageType === "sticker") return "Sent a sticker";
    if (message.messageType === "post_share") return "Shared a post";
    if (message.messageType === "story_reply") return "Replied to a story";
    return message.content || "Message";
  };

  const getReactionUserId = (reaction) =>
    reaction?.user?._id || reaction?.user?.id || reaction?.user;

  const getCurrentUserReaction = (message) => {
    const profileId = String(profile?.id || profile?.userId || profile?._id || "");
    if (!profileId) return null;

    return (message.reactions || []).find(
      (reaction) => String(getReactionUserId(reaction)) === profileId
    );
  };

  const getReactionSummary = (message) => {
    const grouped = new Map();

    (message.reactions || []).forEach((reaction) => {
      if (!reaction?.emoji) return;
      grouped.set(reaction.emoji, (grouped.get(reaction.emoji) || 0) + 1);
    });

    return Array.from(grouped.entries());
  };

  const filteredFriends = searchQuery.trim()
    ? (profile?.friends || []).filter((friend) =>
      friend.fullName.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : [];

  const handleStartChatWithFriend = (friendId) => {
    dispatch(getOrCreateConversationAndSelect(friendId));
    setSearchQuery("");
  };

  const filteredMembersForTag = (() => {
    if (!activeConversation || !activeConversation.isGroup || !showTagDropdown) return [];

    const currentUserId = (profile?.id || profile?.userId || "").toString();
    const otherParticipants = (activeConversation.participants || []).filter(
      (p) => p._id.toString() !== currentUserId
    );

    const allOption = { _id: "all", type: "all", fullName: "Notify everyone", tagText: "@All" };
    let result = [allOption, ...otherParticipants];

    if (tagSearchQuery.trim() !== "") {
      const query = tagSearchQuery.toLowerCase();
      result = result.filter((item) => {
        if (item.type === "all") {
          return "all".includes(query) || "notify everyone".includes(query);
        }
        return item.fullName.toLowerCase().includes(query);
      });
    }

    return result;
  })();

  const handleInputChange = (e) => {
    const value = e.target.value;
    setMessageText(value);

    if (!activeConversation || !activeConversation.isGroup) {
      if (showTagDropdown) setShowTagDropdown(false);
      return;
    }

    const selectionStart = e.target.selectionStart;
    const textBeforeCursor = value.slice(0, selectionStart);
    const lastAtIdx = textBeforeCursor.lastIndexOf("@");

    if (lastAtIdx !== -1) {
      const textBetween = textBeforeCursor.slice(lastAtIdx + 1);
      const charBeforeAt = lastAtIdx > 0 ? textBeforeCursor[lastAtIdx - 1] : "";

      if (!textBetween.includes(" ") && (charBeforeAt === "" || /\s/.test(charBeforeAt))) {
        setShowTagDropdown(true);
        setTagSearchQuery(textBetween);
        setTagTriggerIndex(lastAtIdx);
        setSelectedTagIndex(0);
        return;
      }
    }

    setShowTagDropdown(false);
  };

  const handleSelectTagMember = (member) => {
    const textBeforeAt = messageText.slice(0, tagTriggerIndex);
    const textAfterQuery = messageText.slice(tagTriggerIndex + 1 + tagSearchQuery.length);

    const tagText = member.type === "all" ? "@All" : `@${member.fullName}`;
    const mentionString = `${tagText} `;
    const newText = `${textBeforeAt}${mentionString}${textAfterQuery}`;

    setMessageText(newText);

    if (member.type !== "all") {
      if (!mentionedUsers.some((u) => u.id === member._id)) {
        setMentionedUsers((prev) => [...prev, { id: member._id, fullName: member.fullName }]);
      }
    }

    setShowTagDropdown(false);

    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        const cursorPosition = tagTriggerIndex + mentionString.length;
        inputRef.current.setSelectionRange(cursorPosition, cursorPosition);
      }
    }, 0);
  };

  const currentTypingUsers = activeConversation
    ? Object.keys(typingUsers[activeConversation._id] || {})
      .filter((uid) => typingUsers[activeConversation._id][uid])
      .map((uid) => {
        const participant = activeConversation.participants.find(
          (p) => p._id.toString() === uid
        );
        return participant?.fullName || "Someone";
      })
    : [];

  const rightSidebarContacts = (profile?.friends || []).map((friend) => ({
    id: friend.id || friend._id,
    name: friend.fullName,
    avatar: friend.avatar,
    status: friend.isOnline ? "Online" : "Offline",
    online: friend.isOnline,
  }));

  return (
    <div className="min-h-screen bg-[#f2f3f5] text-[#111827]">
      <div className="min-h-screen w-full bg-white flex flex-col">
        <HomeHeader profile={profile} activePage="messages" />

        <main className="grid h-[calc(100vh-80px)] grid-cols-1 bg-[#f2f3f5] lg:grid-cols-[300px_minmax(0,1fr)_300px] overflow-hidden">
          <aside className="border-r border-gray-200 bg-white flex flex-col h-full min-h-0">
            <div className="p-4 border-b border-gray-100">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-xl font-bold">Chats</h2>
                <button
                  onClick={() => setIsCreateGroupOpen(true)}
                  className="p-1.5 hover:bg-gray-100 rounded-full text-[#1877f2] transition flex items-center justify-center hover:scale-105"
                  title="Create group"
                >
                  <span className="material-symbols-outlined text-[22px]">group_add</span>
                </button>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined text-[20px] text-gray-400 absolute left-3 top-2.5">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Search friends to chat..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#f0f2f5] pl-10 pr-4 py-2 text-sm rounded-full outline-none placeholder:text-gray-400 focus:bg-white focus:ring-1 focus:ring-[#1877f2]"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {searchQuery.trim() !== "" ? (
                <div className="p-2">
                  <p className="text-xs font-bold text-gray-500 uppercase px-2 mb-2">
                    Search Results
                  </p>
                  {filteredFriends.length === 0 ? (
                    <p className="text-sm text-gray-500 p-2">No friends found.</p>
                  ) : (
                    filteredFriends.map((friend) => (
                      <button
                        key={friend.id || friend._id}
                        onClick={() => handleStartChatWithFriend(friend.id || friend._id)}
                        className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition text-left"
                      >
                        <UserAvatar image={friend.avatar} name={friend.fullName} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm truncate">{friend.fullName}</p>
                          <p className="text-xs text-gray-400">Click to start messaging</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {loadingConversations && conversations.length === 0 ? (
                    <div className="flex justify-center p-4">
                      <span className="w-6 h-6 border-2 border-[#1877f2] border-t-transparent rounded-full animate-spin"></span>
                    </div>
                  ) : conversations.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center p-4">
                      No chats yet. Search friends to start a chat!
                    </p>
                  ) : (
                    conversations.map((conv) => {
                      const partner = getChatPartner(conv);
                      const isSelected = activeConversation?._id === conv._id;
                      const hasUnread =
                        conv.lastMessage &&
                        profile &&
                        !conv.lastMessage.readBy?.includes(profile.id || profile.userId);

                      const isMuted = conv.mutedUntil?.some(
                        (m) =>
                          m.user.toString() === (profile?.id || profile?.userId || "").toString() &&
                          m.until &&
                          new Date(m.until) > new Date()
                      );
                      const isBlocked = conv.blockedBy?.includes(profile?.id || profile?.userId);

                      return (
                        <div
                          key={conv._id}
                          onClick={() => dispatch(selectConversationAndFetchMessages(conv))}
                          className={`group relative w-full flex items-center gap-3 p-3 rounded-xl transition text-left cursor-pointer ${
                            isSelected ? "bg-[#e7f3ff] text-[#1877f2]" : "hover:bg-gray-100 text-gray-800"
                          }`}
                        >
                          <div className="relative">
                            <UserAvatar image={partner.avatar} name={partner.fullName} />
                            {partner.isOnline ? (
                              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
                            ) : null}
                          </div>
                          <div className="min-w-0 flex-1 pr-1">
                            <p
                              className={`text-sm truncate flex items-center gap-1.5 ${
                                hasUnread ? "font-bold text-black" : "font-semibold text-gray-800"
                              }`}
                            >
                              {partner.fullName}
                              {isMuted && (
                                <span className="material-symbols-outlined text-xs text-gray-455 select-none" style={{ fontSize: '14px' }}>
                                  notifications_off
                                </span>
                              )}
                            </p>
                            <p
                              className={`text-xs truncate mt-0.5 ${hasUnread ? "font-semibold text-black" : "text-gray-500"
                                }`}
                            >
                              {getConversationPreview(conv, profile)}
                            </p>
                          </div>

                          {/* Right column: meta info & action button */}
                          <div className="w-12 flex flex-col items-end justify-between self-stretch py-0.5 shrink-0 relative">
                            {/* Meta Info (visible when menu is not active and not hovered) */}
                            <div
                              className={`${
                                activeMenuConvId === conv._id ? "hidden" : "flex group-hover:hidden"
                              } flex-col items-end justify-between h-full`}
                            >
                              {conv.updatedAt ? (
                                <span className="text-[10px] text-gray-400 shrink-0">
                                  {format(new Date(conv.updatedAt), "HH:mm")}
                                </span>
                              ) : (
                                <span className="h-3"></span>
                              )}
                              {hasUnread && !isMuted ? (
                                <span className="w-2 h-2 bg-blue-600 rounded-full shrink-0"></span>
                              ) : (
                                <span className="h-2"></span>
                              )}
                            </div>

                            {/* Action Button (visible when menu is active OR hovered) */}
                            <div
                              className={`${
                                activeMenuConvId === conv._id ? "flex" : "hidden group-hover:flex"
                              } items-center justify-center h-full`}
                            >
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMenuConvId(activeMenuConvId === conv._id ? null : conv._id);
                                  setShowMuteSubmenu(false);
                                }}
                                className="w-6 h-6 rounded-full bg-white shadow border border-gray-200 flex items-center justify-center text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition active:scale-95 shrink-0"
                              >
                                <span className="material-symbols-outlined text-[14px] block font-bold">more_horiz</span>
                              </button>
                            </div>

                            {/* Dropdown Menu Overlay */}
                            {activeMenuConvId === conv._id && (
                              <div className="absolute right-0 top-7 z-40 w-48 bg-white border border-gray-200 rounded-xl shadow-xl py-1 text-xs text-gray-700">
                                {showMuteSubmenu ? (
                                  <div className="animate-fade-in">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setShowMuteSubmenu(false);
                                      }}
                                      className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-1.5 font-bold text-gray-800 border-b border-gray-100"
                                    >
                                      <span className="material-symbols-outlined text-[14px]">arrow_back</span>
                                      <span>Back</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleMuteConversation(conv._id, 1);
                                        setActiveMenuConvId(null);
                                      }}
                                      className="w-full text-left px-4 py-2 hover:bg-gray-50 font-semibold"
                                    >
                                      For 1 hour
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleMuteConversation(conv._id, 4);
                                        setActiveMenuConvId(null);
                                      }}
                                      className="w-full text-left px-4 py-2 hover:bg-gray-50 font-semibold"
                                    >
                                      For 4 hours
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleMuteConversation(conv._id, 8);
                                        setActiveMenuConvId(null);
                                      }}
                                      className="w-full text-left px-4 py-2 hover:bg-gray-50 font-semibold"
                                    >
                                      Until 8:00 AM
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleMuteConversation(conv._id, -1);
                                        setActiveMenuConvId(null);
                                      }}
                                      className="w-full text-left px-4 py-2 hover:bg-gray-50 text-blue-600 font-bold"
                                    >
                                      Until turned back on
                                    </button>
                                  </div>
                                ) : (
                                  <div>
                                    {isMuted ? (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleUnmuteConversation(conv._id);
                                          setActiveMenuConvId(null);
                                        }}
                                        className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center justify-between font-semibold"
                                      >
                                        <span>Unmute notifications</span>
                                      </button>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setShowMuteSubmenu(true);
                                        }}
                                        className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center justify-between font-semibold"
                                      >
                                        <span>Mute notifications</span>
                                        <span className="material-symbols-outlined text-[12px] block">chevron_right</span>
                                      </button>
                                    )}

                                    {!conv.isGroup && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (isBlocked) {
                                            handleUnblockConversation(conv._id);
                                          } else {
                                            handleBlockConversation(conv._id);
                                          }
                                          setActiveMenuConvId(null);
                                        }}
                                        className="w-full text-left px-4 py-2 hover:bg-gray-50 font-semibold border-t border-gray-100"
                                      >
                                        {isBlocked ? "Unblock" : "Block user"}
                                      </button>
                                    )}

                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteConversation(conv._id);
                                        setActiveMenuConvId(null);
                                      }}
                                      className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 font-semibold border-t border-gray-100"
                                    >
                                      Delete conversation
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </aside>

          <section className="flex flex-col bg-[#f0f2f5] h-full overflow-hidden min-h-0">
            {activeConversation ? (
              <>
                <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <UserAvatar
                        image={getChatPartner(activeConversation).avatar}
                        name={getChatPartner(activeConversation).fullName}
                      />
                      {getChatPartner(activeConversation).isOnline ? (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
                      ) : null}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 leading-tight">
                        {getChatPartner(activeConversation).fullName}
                      </h3>
                      <p className="text-xs text-emerald-500 flex items-center gap-1">
                        {getChatPartner(activeConversation).isOnline ? (
                          <>
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block"></span>
                            Active now
                          </>
                        ) : (
                          <span className="text-gray-400">
                            {formatLastActive(getChatPartner(activeConversation).lastActive)}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-gray-100 rounded-full text-[#1877f2] transition">
                      <span className="material-symbols-outlined">call</span>
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-full text-[#1877f2] transition">
                      <span className="material-symbols-outlined">videocam</span>
                    </button>
                    {activeConversation?.isGroup ? (
                      <button
                        onClick={() => setShowGroupInfo(!showGroupInfo)}
                        className={`p-2 hover:bg-gray-100 rounded-full transition ${showGroupInfo ? "text-blue-600 bg-blue-50" : "text-[#1877f2]"
                          }`}
                        title="Group info"
                      >
                        <span className="material-symbols-outlined">info</span>
                      </button>
                    ) : (
                      <button className="p-2 hover:bg-gray-100 rounded-full text-[#1877f2] transition">
                        <span className="material-symbols-outlined">info</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 flex flex-col">
                  {loadingMessages && messages.length === 0 ? (
                    <div className="flex justify-center p-4">
                      <span className="w-6 h-6 border-2 border-[#1877f2] border-t-transparent rounded-full animate-spin"></span>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                      <span className="material-symbols-outlined text-4xl mb-2">forum</span>
                      <p className="text-sm">Say hi to your friend to start conversation!</p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      if (msg.messageType === "system") {
                        return (
                          <div key={msg._id} className="flex justify-center my-3 w-full animate-in fade-in duration-300">
                            <div className="bg-gray-200/80 backdrop-blur-sm text-gray-600 text-xs px-4 py-1.5 rounded-full text-center max-w-[85%] font-medium border border-gray-300/30">
                              {msg.content}
                            </div>
                          </div>
                        );
                      }

                      const isMe =
                        profile &&
                        msg.senderId &&
                        (msg.senderId._id || msg.senderId) === (profile.id || profile.userId);
                      const reactionSummary = getReactionSummary(msg);
                      const currentUserReaction = getCurrentUserReaction(msg);

                      return (
                        <div
                          key={msg._id}
                          className={`flex items-end gap-2 ${isMe ? "justify-end" : "justify-start"}`}
                        >
                          {!isMe ? (
                            <UserAvatar
                              image={msg.senderId?.avatar}
                              name={msg.senderId?.fullName}
                              size="sm"
                            />
                          ) : null}
                          <div className="flex flex-col max-w-[70%]">
                            {activeConversation?.isGroup && !isMe && msg.senderId && (
                              <span className="text-[11px] text-gray-500 font-semibold mb-1 ml-1">
                                {msg.senderId.fullName}
                              </span>
                            )}

                            <div 
                              className={`flex items-center gap-2 group ${isMe ? "flex-row-reverse" : "flex-row"}`}
                              onMouseLeave={() => {
                                if (activeMenuMessageId === msg._id) {
                                  setActiveMenuMessageId(null);
                                }
                              }}
                            >
                              {msg.isRevoked ? (
                                <div
                                  className={`px-4 py-2.5 rounded-2xl border text-sm italic shadow-sm break-all ${isMe
                                      ? "bg-gray-100 text-gray-400 border-gray-200 rounded-br-none"
                                      : "bg-gray-200 text-gray-400 border-gray-300 rounded-bl-none"
                                    }`}
                                >
                                  Message has been unsent
                                </div>
                              ) : msg.messageType === "sticker" ? (
                                <img
                                  src={msg.content}
                                  alt="Sticker"
                                  className="h-28 w-28 rounded-xl object-contain"
                                />
                              ) : msg.messageType === "image" ? (
                                <div className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                                  {msg.replyTo && (
                                    <div className={`mb-2 rounded-lg p-2 text-xs flex flex-col gap-0.5 max-w-[280px] border-l-[3px] ${isMe
                                        ? "bg-[#1877f2]/10 border-[#1877f2]/50 text-gray-700"
                                        : "bg-white border-gray-200 text-gray-700 shadow-sm"
                                      }`}>
                                      <span className="font-bold text-gray-800 truncate">
                                        {msg.replyTo.senderId?._id === (profile?.id || profile?.userId)
                                          ? "You"
                                          : msg.replyTo.senderId?.fullName || "User"}
                                      </span>
                                      <span className="truncate text-gray-500">
                                        {getMessagePreviewText(msg.replyTo)}
                                      </span>
                                    </div>
                                  )}
                                  <a
                                    href={getImageUrl(msg.content)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="block"
                                  >
                                    <img
                                      src={getImageUrl(msg.content)}
                                      alt="Chat attachment"
                                      className="max-h-80 max-w-xs rounded-2xl object-cover shadow-sm"
                                      onError={(event) => {
                                        const fallbackUrl = getImageFallbackUrl(msg.content);
                                        if (fallbackUrl && event.currentTarget.src !== fallbackUrl) {
                                          event.currentTarget.src = fallbackUrl;
                                        }
                                      }}
                                    />
                                  </a>
                                </div>
                              ) : msg.messageType === "post_share" ? (
                                <div
                                  className={`max-w-sm rounded-2xl p-2 shadow-sm text-sm ${
                                    isMe
                                      ? "bg-[#1877f2] text-white rounded-br-none"
                                      : "bg-white text-gray-800 rounded-bl-none"
                                  }`}
                                >
                                  {msg.content && msg.content !== "Shared a post" ? (
                                    <p className="px-2 py-1 text-sm">{msg.content}</p>
                                  ) : null}
                                  <div className={isMe ? "[&_*]:text-gray-900" : ""}>
                                    <SharedPostPreview
                                      post={msg.sharedPost}
                                      onOpen={(postId) => navigate(`/?postId=${postId}`)}
                                    />
                                  </div>
                                </div>
                              ) : msg.messageType === "story_reply" ? (
                                <div
                                  className={`max-w-sm rounded-2xl p-2 shadow-sm text-sm ${
                                    isMe
                                      ? "bg-[#1877f2] text-white rounded-br-none"
                                      : "bg-white text-gray-800 rounded-bl-none"
                                  }`}
                                >
                                  <p className="px-2 py-1 text-sm">{msg.content}</p>
                                  <StoryReplyPreview
                                    story={msg.sharedStory}
                                    onOpen={(storyId) => navigate(`/?storyId=${storyId}`)}
                                  />
                                </div>
                              ) : (
                                <div
                                  className={`px-4 py-2.5 rounded-2xl shadow-sm text-sm break-all ${isMe
                                      ? "bg-[#1877f2] text-white rounded-br-none"
                                      : "bg-white text-gray-800 rounded-bl-none"
                                    }`}
                                >
                                  {/* Quoted Reply Message Preview */}
                                  {msg.replyTo && (
                                    <div className={`mb-2 rounded-lg p-2 text-xs flex flex-col gap-0.5 max-w-full border-l-[3px] ${isMe
                                        ? "bg-white/20 border-white/60 text-white/90"
                                        : "bg-black/5 border-black/20 text-gray-800/90"
                                      }`}>
                                      <span className={`font-bold ${isMe ? "text-white" : "text-gray-800"} truncate`}>
                                        {msg.replyTo.senderId?._id === (profile?.id || profile?.userId)
                                          ? "You"
                                          : msg.replyTo.senderId?.fullName || "User"}
                                      </span>
                                      <span className={`truncate ${isMe ? "text-white/80" : "text-gray-500"}`}>
                                        {msg.replyTo.isRevoked ? "Message has been unsent" : getMessagePreviewText(msg.replyTo)}
                                      </span>
                                    </div>
                                  )}
                                  {renderMessageContent(msg.content, msg.mentions, isMe)}
                                </div>
                              )}

                              {/* Hover actions menu */}
                              {!msg.isRevoked && (
                                <div className={`hidden group-hover:flex items-center gap-1.5 transition-all duration-200 shrink-0`}>
                                  <div className="relative">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveMenuMessageId(activeMenuMessageId === msg._id ? null : msg._id);
                                      }}
                                      className="w-6 h-6 rounded-full bg-white shadow-sm border border-gray-200 flex items-center justify-center text-gray-500 hover:text-[#1877f2] hover:bg-blue-50 transition active:scale-95"
                                      title="More"
                                    >
                                      <span className="material-symbols-outlined text-[13px] block">more_horiz</span>
                                    </button>
                                    {activeMenuMessageId === msg._id && (
                                      <div className={`absolute top-7 z-30 w-44 bg-white border border-gray-200 rounded-xl shadow-lg py-1 ${isMe ? "right-0" : "left-0"}`}>
                                        <div className="flex items-center justify-between gap-1 border-b border-gray-100 px-2 py-1.5">
                                          {MESSAGE_REACTIONS.map((emoji) => (
                                            <button
                                              key={emoji}
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleReactMessage(msg, emoji);
                                              }}
                                              className={`flex h-7 w-7 items-center justify-center rounded-full text-base transition hover:bg-blue-50 hover:scale-110 ${
                                                currentUserReaction?.emoji === emoji ? "bg-blue-100 ring-1 ring-[#1877f2]" : ""
                                              }`}
                                              title="React"
                                            >
                                              {emoji}
                                            </button>
                                          ))}
                                        </div>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            navigator.clipboard.writeText(msg.content);
                                            setActiveMenuMessageId(null);
                                          }}
                                          className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                        >
                                          <span className="material-symbols-outlined text-[16px] block">content_copy</span>
                                          Copy
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setReplyingMessage(msg);
                                            setActiveMenuMessageId(null);
                                          }}
                                          className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                        >
                                          <span className="material-symbols-outlined text-[16px] block">format_quote</span>
                                          Reply
                                        </button>
                                        {isMe && (
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleRevokeMessage(msg);
                                              setActiveMenuMessageId(null);
                                            }}
                                            className="w-full text-left px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2"
                                          >
                                            <span className="material-symbols-outlined text-[16px] block">undo</span>
                                            Unsend
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>

                            {reactionSummary.length > 0 ? (
                              <div
                                className={`mt-[-2px] flex ${isMe ? "justify-end pr-2" : "justify-start pl-2"}`}
                              >
                                <div className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2 py-0.5 text-xs shadow-sm">
                                  <span className="tracking-tight">
                                    {reactionSummary.map(([emoji]) => emoji).join(" ")}
                                  </span>
                                  <span className="font-semibold text-gray-500">
                                    {msg.reactions?.length || 0}
                                  </span>
                                </div>
                              </div>
                            ) : null}

                            <span className={`text-[10px] text-gray-400 mt-1 px-1 ${isMe ? "text-right" : "text-left"}`}>
                              {format(new Date(msg.createdAt), "HH:mm")}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}

                  {/* Typing Indicator */}
                  {currentTypingUsers.length > 0 ? (
                    <div className="flex items-center gap-2 text-xs text-gray-500 py-1">
                      <span className="w-5 h-5 flex items-center justify-center shrink-0">
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s] mx-0.5"></span>
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                      </span>
                      <span>{currentTypingUsers.join(", ")} is typing...</span>
                    </div>
                  ) : null}

                  <div ref={messageEndRef} />
                </div>

                {replyingMessage && (
                  <div className="bg-[#f8f9fa] border-t border-gray-200 px-6 py-2.5 flex items-center justify-between shrink-0 animate-in slide-in-from-bottom-2 duration-200">
                    <div className="flex items-center gap-2 border-l-[3px] border-[#1877f2] pl-3 min-w-0">
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-[#1877f2]">
                          Replying to {replyingMessage.senderId?._id === (profile?.id || profile?.userId)
                            ? "yourself"
                            : replyingMessage.senderId?.fullName || "user"}
                        </span>
                        <span className="text-xs text-gray-500 truncate max-w-[500px]">
                          {getMessagePreviewText(replyingMessage)}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReplyingMessage(null)}
                      className="p-1 hover:bg-gray-200 rounded-full text-gray-400 hover:text-gray-600 transition"
                    >
                      <span className="material-symbols-outlined text-[18px] block">close</span>
                    </button>
                  </div>
                )}
              <div className="relative w-full">
                {showTagDropdown && filteredMembersForTag.length > 0 && (
                  <div className="absolute bottom-full left-4 mb-2 z-50 w-[300px] bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-150">
                    {/* Header: Bulb tip */}
                    <div className="flex items-start gap-3 p-3 bg-white border-b border-gray-150">
                      <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[16px]">lightbulb</span>
                      </div>
                      <div className="flex-1 min-w-0 pt-0.5">
                        <p className="text-[11px] font-semibold text-gray-600 leading-normal">
                          Use up/down arrows and press Enter to select
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowTagDropdown(false)}
                        className="p-0.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition shrink-0"
                      >
                        <span className="material-symbols-outlined text-[15px] block">close</span>
                      </button>
                    </div>

                    {/* Member list */}
                    <div className="max-h-60 overflow-y-auto py-1">
                      {filteredMembersForTag.map((member, idx) => {
                        const isSelected = idx === selectedTagIndex;
                        const isAll = member.type === "all";

                        return (
                          <button
                            type="button"
                            key={member._id}
                            onClick={() => handleSelectTagMember(member)}
                            className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors ${
                              isSelected ? "bg-gray-100 text-[#1877f2]" : "hover:bg-gray-50 text-gray-700"
                            }`}
                          >
                            {isAll ? (
                              <div className="w-8 h-8 rounded-full bg-[#1877f2] text-white flex items-center justify-center shrink-0 font-bold text-sm">
                                @
                              </div>
                            ) : (
                              <UserAvatar image={member.avatar} name={member.fullName} size="sm" />
                            )}

                            <div className="flex-1 min-w-0 flex items-center gap-1">
                              <span className={`text-sm truncate ${isSelected ? "font-bold" : "font-medium"}`}>
                                {member.fullName}
                              </span>
                              {isAll && (
                                <span className="text-xs text-blue-600 font-semibold shrink-0">
- @All
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {stickersOpen ? (
                  <div className="absolute bottom-full left-4 right-4 mb-2 z-40 rounded-2xl border border-gray-200 bg-white shadow-xl">
                    <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2">
                      <div className="flex max-w-[80%] gap-2 overflow-x-auto">
                        {stickerPacks.length === 0 ? (
                          <span className="px-2 py-1 text-xs font-semibold text-gray-500">
                            No sticker packs
                          </span>
                        ) : (
                          stickerPacks.map((pack, index) => (
                            <button
                              key={pack.name}
                              type="button"
                              onClick={() => setActiveStickerPack(index)}
                              className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                                activeStickerPack === index
                                  ? "bg-[#1877f2] text-white"
                                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                              }`}
                            >
                              {pack.name}
                            </button>
                          ))
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setStickersOpen(false)}
                        className="rounded-full p-1 text-gray-500 hover:bg-gray-100"
                      >
                        <span className="material-symbols-outlined text-[18px]">close</span>
                      </button>
                    </div>

                    <div className="grid max-h-64 grid-cols-5 gap-2 overflow-y-auto p-3 sm:grid-cols-8">
                      {(stickerPacks[activeStickerPack]?.stickers || []).map((sticker) => (
                        <button
                          key={sticker._id}
                          type="button"
                          onClick={() => handleSendSticker(sticker)}
                          className="rounded-lg p-1 hover:bg-gray-100"
                          title={sticker.name}
                        >
                          <img
                            src={sticker.imageUrl}
                            alt={sticker.name}
                            className="h-14 w-14 object-contain"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                <form
                  onSubmit={handleSendMessage}
                  className="bg-white border-t border-gray-200 p-4 flex flex-col gap-3 shrink-0"
                >
                  {pendingImages.length > 0 ? (
                    <div className="border-t border-gray-100 pt-2">
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="font-semibold text-gray-700">
                          {pendingImages.length} ảnh
                        </span>
                        <button
                          type="button"
                          onClick={clearPendingImages}
                          disabled={isUploadingImage}
                          className="font-medium text-gray-500 hover:text-[#1877f2] disabled:cursor-not-allowed disabled:text-gray-300"
                        >
                          Xóa tất cả
                        </button>
                      </div>
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {pendingImages.map((image) => (
                          <div
                            key={image.id}
                            className="group relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded border border-gray-200 bg-gray-100"
                          >
                            <img
                              src={image.previewUrl}
                              alt={image.file.name || "Selected attachment preview"}
                              className="h-full w-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => removePendingImage(image.id)}
                              disabled={isUploadingImage}
                              className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white opacity-100 transition hover:bg-black/75 disabled:cursor-not-allowed disabled:bg-gray-400"
                              aria-label="Remove selected image"
                              title="Remove selected image"
                            >
                              <span className="material-symbols-outlined text-[14px]">close</span>
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => imageInputRef.current?.click()}
                          disabled={isUploadingImage || !activeConversation}
                          className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded border border-dashed border-gray-300 bg-gray-50 text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-300"
                          aria-label="Add more images"
                          title="Add more images"
                        >
                          <span className="material-symbols-outlined text-[28px]">add</span>
                        </button>
                      </div>
                    </div>
                  ) : null}

                  <div className="flex items-center gap-3">
                    <button type="button" className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition">
                      <span className="material-symbols-outlined">add_circle</span>
                    </button>
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleSendImage}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      disabled={isUploadingImage || !activeConversation}
                      className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition disabled:cursor-not-allowed disabled:text-gray-300"
                      title={isUploadingImage ? "Uploading image..." : "Choose image"}
                    >
                      <span className="material-symbols-outlined">
                        {isUploadingImage ? "hourglass_empty" : "image"}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStickersOpen((open) => !open)}
                      className={`p-2 hover:bg-gray-100 rounded-full transition ${
                        stickersOpen ? "text-[#1877f2] bg-blue-50" : "text-gray-500"
                      }`}
                    >
                      <span className="material-symbols-outlined">sticky_note_2</span>
                    </button>
                    <input
                      ref={inputRef}
                      type="text"
                      placeholder={pendingImages.length > 0 ? "Press send to share images..." : "Type a message..."}
                      value={messageText}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      onPaste={handlePasteImage}
                      disabled={isUploadingImage}
                      className="flex-1 bg-[#f0f2f5] px-4 py-2.5 text-sm rounded-full outline-none placeholder:text-gray-500 focus:bg-white focus:ring-1 focus:ring-[#1877f2] disabled:text-gray-400"
                    />
                    <button
                      type="submit"
                      disabled={isUploadingImage || (!messageText.trim() && pendingImages.length === 0)}
                      className="p-2.5 bg-[#1877f2] hover:bg-[#166fe5] text-white rounded-full shadow-md transition disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      <span className="material-symbols-outlined text-[20px] block">
                        {isUploadingImage ? "hourglass_empty" : "send"}
                      </span>
                    </button>
                  </div>
                </form>
              </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-6 text-center">
                <div className="w-20 h-20 bg-blue-50 text-[#1877f2] flex items-center justify-center rounded-full mb-4">
                  <span className="material-symbols-outlined text-[40px]">forum</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">No Active Chat</h3>
                <p className="text-sm text-gray-500 max-w-sm">
                  Select a chat from the recent lists on the left, or search for a friend to start chatting instantly.
                </p>
              </div>
            )}
          </section>

          {activeConversation?.isGroup && showGroupInfo ? (
            <GroupSidebar
              conversation={activeConversation}
              profile={profile}
              onLeaveGroup={handleLeaveGroup}
              onRemoveMember={handleRemoveMember}
              onAddMemberClick={() => setIsAddMembersOpen(true)}
            />
          ) : (
            <RightSidebar
              contacts={rightSidebarContacts}
              profile={profile}
              onContactClick={(contact) => handleStartChatWithFriend(contact.id)}
            />
          )}
        </main>

        {isCreateGroupOpen ? (
          <CreateGroupModal
            onClose={() => setIsCreateGroupOpen(false)}
            friends={profile?.friends || []}
            onCreateGroup={handleCreateGroup}
          />
        ) : null}

        {isAddMembersOpen ? (
          <AddMembersModal
            onClose={() => setIsAddMembersOpen(false)}
            friends={profile?.friends || []}
            conversation={activeConversation}
            onAddMembers={handleAddMembers}
          />
        ) : null}

        {/* Custom Confirmation Popup Modal */}
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          message={confirmModal.message}
          confirmBtnText={confirmModal.confirmBtnText}
          isDanger={confirmModal.isDanger}
          onConfirm={confirmModal.onConfirm}
          onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        />
      </div>
    </div>
  );
};

export default ChatPage;


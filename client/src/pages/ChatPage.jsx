import { useEffect, useRef, useState, useMemo } from "react";
import { format } from "date-fns";
import HomeHeader from "../components/home/HomeHeader";
import LeftSidebar from "../components/home/LeftSidebar";
import RightSidebar from "../components/home/RightSidebar";
import HomeAvatar from "../components/home/HomeAvatar";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchUserProfile } from "../store/slices/userSlice";
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
} from "../store/slices/chatSlice";

const getChatWsUrl = (token) => {
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

const ChatPage = () => {
  const dispatch = useAppDispatch();
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
  const typingTimeoutRef = useRef(null);
  const messageEndRef = useRef(null);

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

  const handleCreateGroup = (name, participantIds) => {
    dispatch(createGroup({ name, participantIds }))
      .unwrap()
      .then(() => {
        setIsCreateGroupOpen(false);
      })
      .catch((err) => {
        alert(err || "Lỗi tạo nhóm");
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
        alert(err || "Lỗi thêm thành viên");
      });
  };

  const handleRemoveMember = (memberId) => {
    if (!activeConversation) return;
    setConfirmModal({
      isOpen: true,
      title: "Xóa thành viên",
      message: "Bạn có chắc chắn muốn xóa thành viên này khỏi nhóm?",
      confirmBtnText: "Xóa",
      isDanger: true,
      onConfirm: () => {
        dispatch(removeGroupMember({ conversationId: activeConversation._id, memberId }))
          .unwrap()
          .then(() => {
            setConfirmModal(prev => ({ ...prev, isOpen: false }));
          })
          .catch((err) => {
            alert(err || "Lỗi xóa thành viên");
          });
      }
    });
  };

  const handleLeaveGroup = () => {
    if (!activeConversation) return;
    setConfirmModal({
      isOpen: true,
      title: "Rời khỏi nhóm",
      message: "Bạn có chắc chắn muốn rời khỏi nhóm này?",
      confirmBtnText: "Rời nhóm",
      isDanger: true,
      onConfirm: () => {
        dispatch(leaveGroup(activeConversation._id))
          .unwrap()
          .then(() => {
            setShowGroupInfo(false);
            setConfirmModal(prev => ({ ...prev, isOpen: false }));
          })
          .catch((err) => {
            alert(err || "Lỗi rời nhóm");
          });
      }
    });
  };

  // Load profile và danh sách hội thoại lúc khởi động
  useEffect(() => {
    dispatch(fetchUserProfile());
    dispatch(fetchConversations());
  }, [dispatch]);

  // Cuộn xuống tin nhắn mới nhất
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Thiết lập kết nối WebSocket
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
            
            // Nếu nhận được tin nhắn và đang mở hội thoại đó, đánh dấu đã đọc
            if (activeConversation && activeConversation._id === payload.data.conversationId) {
              ws.send(
                JSON.stringify({
                  type: "read_receipt",
                  conversationId: activeConversation._id,
                })
              );
            }
          } else if (type === "conversation_update") {
            dispatch(updateConversationListItem(payload.data));
          } else if (type === "conversation_remove") {
            dispatch(removeConversationFromList(payload.conversationId));
          } else if (type === "typing") {
            const { conversationId, userId, isTyping } = payload;
            dispatch(setTypingStatus({ conversationId, userId, isTyping }));
          }
        } catch (error) {
          console.error("Error parsing websocket message:", error);
        }
      };

      ws.onclose = () => {
        console.log("Chat websocket disconnected");
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
  }, [dispatch, activeConversation?._id]);

  // Đánh dấu đã đọc khi chuyển sang cuộc hội thoại mới
  useEffect(() => {
    if (
      socket &&
      socket.readyState === WebSocket.OPEN &&
      activeConversation?._id
    ) {
      socket.send(
        JSON.stringify({
          type: "read_receipt",
          conversationId: activeConversation._id,
        })
      );
    }
  }, [activeConversation?._id, socket, messages.length]);

  // Xử lý gửi tin nhắn
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (
      !messageText.trim() ||
      !activeConversation ||
      !socket ||
      socket.readyState !== WebSocket.OPEN
    )
      return;

    const payload = {
      type: "send_message",
      conversationId: activeConversation._id,
      content: messageText.trim(),
      messageType: "text",
    };

    socket.send(JSON.stringify(payload));
    setMessageText("");
    
    // Ngắt thông báo đang gõ ngay khi gửi tin
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
  };

  // Trạng thái đang gõ
  const handleKeyDown = () => {
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

  // Trả về tên hiển thị của cuộc trò chuyện 1-1
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

  // Lấy danh sách bạn bè dựa trên query tìm kiếm
  const filteredFriends = searchQuery.trim()
    ? (profile?.friends || []).filter((friend) =>
        friend.fullName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  // Bắt đầu chat với bạn bè được chọn
  const handleStartChatWithFriend = (friendId) => {
    dispatch(getOrCreateConversationAndSelect(friendId));
    setSearchQuery("");
  };

  // Xác định những người dùng đang gõ trong cuộc trò chuyện hiện tại
  const currentTypingUsers = activeConversation
    ? Object.keys(typingUsers[activeConversation._id] || {})
        .filter((uid) => typingUsers[activeConversation._id][uid])
        .map((uid) => {
          const participant = activeConversation.participants.find(
            (p) => p._id.toString() === uid
          );
          return participant?.fullName || "Ai đó";
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
    <div className="min-h-screen bg-gradient-to-br from-[#0f49b5] via-[#1e63d6] to-[#3b82f6] px-4 py-6 text-[#111827]">
      <div className="mx-auto max-w-[1320px] overflow-hidden rounded-[28px] bg-white shadow-2xl">
        <HomeHeader profile={profile} activePage="messages" />

        <main className="grid min-h-[760px] max-h-[760px] grid-cols-1 bg-[#f2f3f5] lg:grid-cols-[300px_minmax(0,1fr)_300px]">
          {/* Thanh menu bên trái */}
          <aside className="border-r border-gray-200 bg-white flex flex-col">
            <div className="p-4 border-b border-gray-100">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-xl font-bold">Chats</h2>
                <button
                  onClick={() => setIsCreateGroupOpen(true)}
                  className="p-1.5 hover:bg-gray-100 rounded-full text-[#1877f2] transition flex items-center justify-center hover:scale-105"
                  title="Tạo nhóm"
                >
                  <span className="material-symbols-outlined text-[22px]">group_add</span>
                </button>
              </div>
              {/* Thanh tìm kiếm */}
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

            {/* Vùng hiển thị danh sách hội thoại / tìm kiếm */}
            <div className="flex-1 overflow-y-auto">
              {searchQuery.trim() !== "" ? (
                // Kết quả tìm kiếm bạn bè để chat
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
                        <HomeAvatar image={friend.avatar} name={friend.fullName} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm truncate">{friend.fullName}</p>
                          <p className="text-xs text-gray-400">Click to start messaging</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              ) : (
                // Danh sách hội thoại đang có
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

                      return (
                        <button
                          key={conv._id}
                          onClick={() => dispatch(selectConversationAndFetchMessages(conv))}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl transition text-left ${
                            isSelected ? "bg-[#e7f3ff] text-[#1877f2]" : "hover:bg-gray-100"
                          }`}
                        >
                          <div className="relative">
                            <HomeAvatar image={partner.avatar} name={partner.fullName} />
                            {partner.isOnline ? (
                              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
                            ) : null}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex justify-between items-baseline">
                              <p
                                className={`text-sm truncate ${
                                  hasUnread ? "font-bold text-black" : "font-semibold text-gray-800"
                                }`}
                              >
                                {partner.fullName}
                              </p>
                              {conv.updatedAt ? (
                                <span className="text-[10px] text-gray-400 shrink-0">
                                  {format(new Date(conv.updatedAt), "HH:mm")}
                                </span>
                              ) : null}
                            </div>
                            <p
                              className={`text-xs truncate ${
                                hasUnread ? "font-semibold text-black" : "text-gray-500"
                              }`}
                            >
                              {conv.lastMessage
                                ? conv.lastMessage.senderId?._id === (profile?.id || profile?.userId)
                                  ? `You: ${conv.lastMessage.content}`
                                  : conv.lastMessage.content
                                : "No messages yet"}
                            </p>
                          </div>
                          {hasUnread ? (
                            <span className="w-2.5 h-2.5 bg-blue-600 rounded-full shrink-0"></span>
                          ) : null}
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </aside>

          {/* Vùng trò chuyện chính */}
          <section className="flex flex-col bg-[#f0f2f5] h-full overflow-hidden">
            {activeConversation ? (
              <>
                {/* Header trò chuyện */}
                <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <HomeAvatar
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
                          <span className="text-gray-400">Offline</span>
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
                        className={`p-2 hover:bg-gray-100 rounded-full transition ${
                          showGroupInfo ? "text-blue-600 bg-blue-50" : "text-[#1877f2]"
                        }`}
                        title="Thông tin nhóm"
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

                {/* Khu vực tin nhắn */}
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

                      return (
                        <div
                          key={msg._id}
                          className={`flex items-end gap-2 ${isMe ? "justify-end" : "justify-start"}`}
                        >
                          {!isMe ? (
                            <HomeAvatar
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
                              className={`px-4 py-2.5 rounded-2xl shadow-sm text-sm break-all ${
                                isMe
                                  ? "bg-[#1877f2] text-white rounded-br-none"
                                  : "bg-white text-gray-800 rounded-bl-none"
                              }`}
                            >
                              {msg.content}
                            </div>
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

                {/* Khung soạn tin */}
                <form
                  onSubmit={handleSendMessage}
                  className="bg-white border-t border-gray-200 p-4 flex items-center gap-3 shrink-0"
                >
                  <button type="button" className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition">
                    <span className="material-symbols-outlined">add_circle</span>
                  </button>
                  <button type="button" className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition">
                    <span className="material-symbols-outlined">image</span>
                  </button>
                  <button type="button" className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition">
                    <span className="material-symbols-outlined">sticky_note_2</span>
                  </button>
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 bg-[#f0f2f5] px-4 py-2.5 text-sm rounded-full outline-none placeholder:text-gray-500 focus:bg-white focus:ring-1 focus:ring-[#1877f2]"
                  />
                  <button
                    type="submit"
                    disabled={!messageText.trim()}
                    className="p-2.5 bg-[#1877f2] hover:bg-[#166fe5] text-white rounded-full shadow-md transition disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    <span className="material-symbols-outlined text-[20px] block">send</span>
                  </button>
                </form>
              </>
            ) : (
              // Trạng thái trống
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

          {/* Right Sidebar - Bạn bè online / Chi tiết nhóm */}
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

        {/* Modal Tạo Nhóm */}
        <CreateGroupModal
          isOpen={isCreateGroupOpen}
          onClose={() => setIsCreateGroupOpen(false)}
          friends={profile?.friends || []}
          onCreateGroup={handleCreateGroup}
        />

        {/* Modal Thêm Thành Viên */}
        <AddMembersModal
          isOpen={isAddMembersOpen}
          onClose={() => setIsAddMembersOpen(false)}
          friends={profile?.friends || []}
          conversation={activeConversation}
          onAddMembers={handleAddMembers}
        />

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

const GroupSidebar = ({ conversation, profile, onLeaveGroup, onRemoveMember, onAddMemberClick }) => {
  const currentUserId = profile?.id || profile?.userId;
  const isAdmin = conversation?.admin?._id 
    ? conversation.admin._id.toString() === currentUserId?.toString()
    : conversation?.admin?.toString() === currentUserId?.toString();

  return (
    <aside className="hidden bg-white border-l border-gray-200 px-6 py-6 lg:flex flex-col h-full overflow-y-auto">
      <div className="flex flex-col items-center border-b border-gray-100 pb-6 mb-6">
        <HomeAvatar image={conversation.avatar} name={conversation.name} size="lg" />
        <h3 className="text-lg font-bold text-gray-900 mt-3 text-center">{conversation.name}</h3>
        <span className="text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full font-semibold mt-2">
          Nhóm ({conversation.participants?.length || 0} thành viên)
        </span>
      </div>

      <div className="flex-1">
        <div className="mb-4">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Thành viên nhóm
            </h4>
            <button
              onClick={onAddMemberClick}
              className="p-1 hover:bg-gray-100 rounded-full text-blue-600 transition flex items-center justify-center hover:scale-105"
              title="Thêm thành viên"
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
            </button>
          </div>
          <div className="space-y-3">
            {conversation.participants?.map((member) => {
              const isMemberAdmin = conversation.admin?._id
                ? conversation.admin._id.toString() === member._id.toString()
                : conversation.admin?.toString() === member._id.toString();
              const isSelf = member._id.toString() === currentUserId?.toString();

              return (
                <div key={member._id} className="flex items-center justify-between gap-3 p-1 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-3 min-w-0">
                    <HomeAvatar image={member.avatar} name={member.fullName} size="sm" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {member.fullName} {isSelf && <span className="text-xs text-gray-400 font-normal">(Bạn)</span>}
                      </p>
                      {isMemberAdmin && (
                        <span className="text-[10px] text-amber-600 font-bold flex items-center gap-0.5 mt-0.5">
                          <span className="material-symbols-outlined text-[12px]">shield</span>
                          Trưởng nhóm
                        </span>
                      )}
                    </div>
                  </div>

                  {isAdmin && !isMemberAdmin && (
                    <button
                      onClick={() => onRemoveMember(member._id)}
                      className="p-1 hover:bg-red-50 text-red-500 rounded-full transition hover:scale-105"
                      title="Xóa khỏi nhóm"
                    >
                      <span className="material-symbols-outlined text-[18px]">person_remove</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-100 mt-auto">
        <button
          onClick={onLeaveGroup}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-sm rounded-xl transition hover:scale-[1.02]"
        >
          <span className="material-symbols-outlined text-[18px]">logout</span>
          Rời khỏi nhóm
        </button>
      </div>
    </aside>
  );
};

const CreateGroupModal = ({ isOpen, onClose, friends, onCreateGroup }) => {
  const [groupName, setGroupName] = useState("");
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (isOpen) {
      setGroupName("");
      setSelectedFriends([]);
      setErrorMsg("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleFriend = (friendId) => {
    if (selectedFriends.includes(friendId)) {
      setSelectedFriends(selectedFriends.filter((id) => id !== friendId));
    } else {
      setSelectedFriends([...selectedFriends, friendId]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!groupName.trim()) {
      setErrorMsg("Tên nhóm không được để trống");
      return;
    }
    if (selectedFriends.length < 2) {
      setErrorMsg("Vui lòng chọn ít nhất 2 bạn bè để tạo nhóm (tối thiểu 3 người tính cả bạn)");
      return;
    }
    onCreateGroup(groupName.trim(), selectedFriends);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-600">group_add</span>
            Tạo Nhóm Mới
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full text-gray-400 transition">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col max-h-[80vh]">
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-xs rounded-xl font-medium border border-red-100">
              {errorMsg}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Tên Nhóm
            </label>
            <input
              type="text"
              placeholder="Nhập tên nhóm của bạn..."
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full bg-gray-50 px-4 py-2.5 text-sm rounded-xl outline-none border border-transparent focus:border-blue-500 focus:bg-white transition"
              autoFocus
            />
          </div>

          <div className="flex-1 overflow-y-auto mb-6 max-h-[260px] pr-1">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Chọn Thành Viên ({selectedFriends.length} đã chọn)
            </label>
            {friends.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">Bạn chưa có bạn bè nào để tạo nhóm.</p>
            ) : (
              <div className="space-y-1">
                {friends.map((friend) => {
                  const isChecked = selectedFriends.includes(friend.id || friend._id);
                  return (
                    <div
                      key={friend.id || friend._id}
                      onClick={() => handleToggleFriend(friend.id || friend._id)}
                      className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition ${
                        isChecked ? "bg-blue-50/50 border-blue-100" : "hover:bg-gray-50 border-transparent"
                      } border`}
                    >
                      <div className="flex items-center gap-3">
                        <HomeAvatar image={friend.avatar} name={friend.fullName} size="sm" />
                        <span className="text-sm font-semibold text-gray-800">{friend.fullName}</span>
                      </div>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition ${
                        isChecked ? "bg-blue-600 border-blue-600 text-white" : "border-gray-300 bg-white"
                      }`}>
                        {isChecked && <span className="material-symbols-outlined text-[14px] font-bold">check</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-auto pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-md transition hover:scale-[1.02] disabled:bg-gray-200 disabled:text-gray-400 disabled:scale-100 disabled:cursor-not-allowed"
            >
              Tạo nhóm
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmBtnText = "Xác nhận", isDanger = false }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-5">
          <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-500 leading-relaxed">{message}</p>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-semibold text-white rounded-xl shadow-md transition hover:scale-[1.02] ${
              isDanger ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {confirmBtnText}
          </button>
        </div>
      </div>
    </div>
  );
};

const AddMembersModal = ({ isOpen, onClose, friends, conversation, onAddMembers }) => {
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");

  const existingParticipantIds = useMemo(() => {
    return (conversation?.participants || []).map((p) => (p._id || p).toString());
  }, [conversation]);

  const addableFriends = useMemo(() => {
    return friends.filter((friend) => {
      const fId = (friend.id || friend._id || "").toString();
      return !existingParticipantIds.includes(fId);
    });
  }, [friends, existingParticipantIds]);

  useEffect(() => {
    if (isOpen) {
      setSelectedFriends([]);
      setErrorMsg("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleFriend = (friendId) => {
    if (selectedFriends.includes(friendId)) {
      setSelectedFriends(selectedFriends.filter((id) => id !== friendId));
    } else {
      setSelectedFriends([...selectedFriends, friendId]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedFriends.length === 0) {
      setErrorMsg("Vui lòng chọn ít nhất 1 bạn bè để thêm");
      return;
    }
    onAddMembers(selectedFriends);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-600">person_add</span>
            Thêm Thành Viên Vào Nhóm
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full text-gray-400 transition">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col max-h-[80vh]">
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-xs rounded-xl font-medium border border-red-100">
              {errorMsg}
            </div>
          )}

          <div className="flex-1 overflow-y-auto mb-6 max-h-[260px] pr-1">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Chọn Bạn Bè ({selectedFriends.length} đã chọn)
            </label>
            {addableFriends.length === 0 ? (
              <p className="text-sm text-gray-400 py-6 text-center">Tất cả bạn bè của bạn đều đã có mặt trong nhóm này.</p>
            ) : (
              <div className="space-y-1">
                {addableFriends.map((friend) => {
                  const isChecked = selectedFriends.includes(friend.id || friend._id);
                  return (
                    <div
                      key={friend.id || friend._id}
                      onClick={() => handleToggleFriend(friend.id || friend._id)}
                      className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition ${
                        isChecked ? "bg-blue-50/50 border-blue-100" : "hover:bg-gray-50 border-transparent"
                      } border`}
                    >
                      <div className="flex items-center gap-3">
                        <HomeAvatar image={friend.avatar} name={friend.fullName} size="sm" />
                        <span className="text-sm font-semibold text-gray-800">{friend.fullName}</span>
                      </div>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition ${
                        isChecked ? "bg-blue-600 border-blue-600 text-white" : "border-gray-300 bg-white"
                      }`}>
                        {isChecked && <span className="material-symbols-outlined text-[14px] font-bold">check</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-auto pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={addableFriends.length === 0}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-md transition hover:scale-[1.02] disabled:bg-gray-200 disabled:text-gray-400 disabled:scale-100 disabled:cursor-not-allowed"
            >
              Thêm vào nhóm
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

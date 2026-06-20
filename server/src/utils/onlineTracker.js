const User = require("../models/user.model");
const Conversation = require("../models/conversation.model");

// Keep track of active connection counts for each user in each service
const chatConnections = new Map(); // userId string -> count
const notificationConnections = new Map(); // userId string -> count

// Callback functions to send message to user via chat and notification services
let sendToUserChat = null;
let sendToUserNotification = null;

function setChatSendHelper(helper) {
  sendToUserChat = helper;
}

function setNotificationSendHelper(helper) {
  sendToUserNotification = helper;
}

function sendChatToUser(userId, payload) {
  if (sendToUserChat) {
    sendToUserChat(userId, payload);
  }
}

function getOnlineStatus(userId) {
  const key = userId.toString();
  const chatCount = chatConnections.get(key) || 0;
  const notificationCount = notificationConnections.get(key) || 0;
  return (chatCount + notificationCount) > 0;
}

async function handleConnectionChange(userId, isConnect, type) {
  const key = userId.toString();
  const connMap = type === "chat" ? chatConnections : notificationConnections;
  
  const wasOnline = getOnlineStatus(userId);
  
  let currentCount = connMap.get(key) || 0;
  if (isConnect) {
    connMap.set(key, currentCount + 1);
  } else {
    currentCount = Math.max(0, currentCount - 1);
    if (currentCount === 0) {
      connMap.delete(key);
    } else {
      connMap.set(key, currentCount);
    }
  }
  
  const isOnline = getOnlineStatus(userId);
  
  if (wasOnline !== isOnline) {
    // Status changed!
    await handleStatusChange(userId, isOnline);
  }
}

async function handleStatusChange(userId, isOnline) {
  try {
    const lastActive = new Date();
    // 1. Update DB
    await User.findByIdAndUpdate(userId, { isOnline, lastActive });
    console.log(`User ${userId} is now ${isOnline ? "ONLINE" : "OFFLINE"} (lastActive: ${lastActive})`);
    
    // 2. Find all participants who need to be notified (all people sharing a conversation with this user)
    const conversations = await Conversation.find({ participants: userId }, "participants");
    const recipientIds = new Set();
    conversations.forEach((conv) => {
      conv.participants.forEach((pId) => {
        if (pId.toString() !== userId.toString()) {
          recipientIds.add(pId.toString());
        }
      });
    });
    
    const payload = {
      type: "user_status_change",
      data: {
        userId: userId.toString(),
        isOnline,
        lastActive,
      },
    };
    
    // 3. Send payload to all online recipients
    recipientIds.forEach((rId) => {
      if (sendToUserChat) {
        sendToUserChat(rId, payload);
      }
      if (sendToUserNotification) {
        sendToUserNotification(rId, payload);
      }
    });
  } catch (err) {
    console.error("Error in handleStatusChange:", err);
  }
}

module.exports = {
  handleConnectionChange,
  getOnlineStatus,
  setChatSendHelper,
  setNotificationSendHelper,
  sendChatToUser,
};

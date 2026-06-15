import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { chatAPI } from "../../services/api";

const initialState = {
  conversations: [],
  activeConversation: null,
  messages: [],
  typingUsers: {}, // Map: conversationId -> { userId: boolean }
  loadingConversations: false,
  loadingMessages: false,
  error: null,
};

export const fetchConversations = createAsyncThunk(
  "chat/fetchConversations",
  async (_, { rejectWithValue }) => {
    try {
      const response = await chatAPI.getConversations();
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch conversations"
      );
    }
  }
);

export const fetchMessages = createAsyncThunk(
  "chat/fetchMessages",
  async (conversationId, { rejectWithValue }) => {
    try {
      const response = await chatAPI.getMessages(conversationId);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch messages"
      );
    }
  }
);

export const selectConversationAndFetchMessages = createAsyncThunk(
  "chat/selectConversationAndFetchMessages",
  async (conversation, { dispatch }) => {
    dispatch(setActiveConversation(conversation));
    if (conversation?._id) {
      dispatch(fetchMessages(conversation._id));
    }
    return conversation;
  }
);

export const getOrCreateConversationAndSelect = createAsyncThunk(
  "chat/getOrCreateConversationAndSelect",
  async (targetUserId, { dispatch, rejectWithValue }) => {
    try {
      const response = await chatAPI.getOrCreateConversation(targetUserId);
      const conversation = response.data.data;
      dispatch(selectConversationAndFetchMessages(conversation));
      dispatch(fetchConversations()); // Refresh list of conversations
      return conversation;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create/get conversation"
      );
    }
  }
);

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setActiveConversation: (state, action) => {
      state.activeConversation = action.payload;
      state.messages = [];
    },
    clearActiveConversation: (state) => {
      state.activeConversation = null;
      state.messages = [];
    },
    addReceivedMessage: (state, action) => {
      const message = action.payload;
      if (
        state.activeConversation &&
        state.activeConversation._id === message.conversationId
      ) {
        // Tránh trùng lặp tin nhắn
        const exists = state.messages.some((m) => m._id === message._id);
        if (!exists) {
          state.messages.push(message);
        }
      }
    },
    updateConversationListItem: (state, action) => {
      const updatedConv = action.payload;
      const index = state.conversations.findIndex((c) => c._id === updatedConv._id);
      
      if (index !== -1) {
        state.conversations[index] = {
          ...state.conversations[index],
          ...updatedConv,
        };
      } else {
        state.conversations.push(updatedConv);
      }
      
      // Sắp xếp lại danh sách hội thoại theo updatedAt giảm dần
      state.conversations.sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    },
    setTypingStatus: (state, action) => {
      const { conversationId, userId, isTyping } = action.payload;
      if (!state.typingUsers[conversationId]) {
        state.typingUsers[conversationId] = {};
      }
      state.typingUsers[conversationId][userId] = isTyping;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Conversations
      .addCase(fetchConversations.pending, (state) => {
        state.loadingConversations = true;
        state.error = null;
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.loadingConversations = false;
        state.conversations = action.payload;
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.loadingConversations = false;
        state.error = action.payload;
      })
      
      // Fetch Messages
      .addCase(fetchMessages.pending, (state) => {
        state.loadingMessages = true;
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.loadingMessages = false;
        state.messages = action.payload;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.loadingMessages = false;
        state.error = action.payload;
      });
  },
});

export const {
  setActiveConversation,
  clearActiveConversation,
  addReceivedMessage,
  updateConversationListItem,
  setTypingStatus,
  clearError,
} = chatSlice.actions;

export default chatSlice.reducer;

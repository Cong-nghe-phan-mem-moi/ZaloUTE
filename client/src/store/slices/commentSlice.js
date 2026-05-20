import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { commentAPI } from "../../services/api";

const initialState = {
  comments: [],
  currentComment: null,
  loading: false,
  error: null,
  message: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  },
};

// Thêm bình luận
export const createComment = createAsyncThunk(
  "comments/createComment",
  async ({ postId, content, replyTo }, { rejectWithValue }) => {
    try {
      const response = await commentAPI.createComment(postId, content, replyTo);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Không thể thêm bình luận",
      );
    }
  },
);

// Lấy bình luận của bài viết
export const getPostComments = createAsyncThunk(
  "comments/getPostComments",
  async ({ postId, page = 1, limit = 20 }, { rejectWithValue }) => {
    try {
      const response = await commentAPI.getPostComments(postId, page, limit);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Không thể tải bình luận",
      );
    }
  },
);

// Chỉnh sửa bình luận
export const updateComment = createAsyncThunk(
  "comments/updateComment",
  async ({ commentId, content }, { rejectWithValue }) => {
    try {
      const response = await commentAPI.updateComment(commentId, content);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Không thể chỉnh sửa bình luận",
      );
    }
  },
);

// Xóa bình luận
export const deleteComment = createAsyncThunk(
  "comments/deleteComment",
  async (commentId, { rejectWithValue }) => {
    try {
      await commentAPI.deleteComment(commentId);
      return commentId;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Không thể xóa bình luận",
      );
    }
  },
);

// Like/Unlike bình luận
export const toggleLike = createAsyncThunk(
  "comments/toggleLike",
  async (commentId, { rejectWithValue }) => {
    try {
      const response = await commentAPI.toggleLike(commentId);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Không thể thích bình luận",
      );
    }
  },
);

// Lấy reply của bình luận
export const getCommentReplies = createAsyncThunk(
  "comments/getCommentReplies",
  async ({ commentId, page = 1, limit = 10 }, { rejectWithValue }) => {
    try {
      const response = await commentAPI.getCommentReplies(
        commentId,
        page,
        limit,
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Không thể tải reply",
      );
    }
  },
);

const commentSlice = createSlice({
  name: "comments",
  initialState,
  reducers: {
    clearMessage: (state) => {
      state.message = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Create comment
    builder
      .addCase(createComment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createComment.fulfilled, (state, action) => {
        state.loading = false;
        state.message = "Bình luận được thêm thành công";
        state.comments.unshift(action.payload);
      })
      .addCase(createComment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Get post comments
    builder
      .addCase(getPostComments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getPostComments.fulfilled, (state, action) => {
        state.loading = false;
        state.comments = action.payload.comments || [];
        state.pagination = action.payload.pagination || initialState.pagination;
      })
      .addCase(getPostComments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Update comment
    builder
      .addCase(updateComment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateComment.fulfilled, (state, action) => {
        state.loading = false;
        state.message = "Bình luận được cập nhật thành công";
        const index = state.comments.findIndex(
          (c) => c._id === action.payload._id,
        );
        if (index >= 0) {
          state.comments[index] = action.payload;
        }
      })
      .addCase(updateComment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Delete comment
    builder
      .addCase(deleteComment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteComment.fulfilled, (state, action) => {
        state.loading = false;
        state.message = "Bình luận được xóa thành công";
        state.comments = state.comments.filter((c) => c._id !== action.payload);
      })
      .addCase(deleteComment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Toggle like
    builder
      .addCase(toggleLike.pending, (state) => {
        state.error = null;
      })
      .addCase(toggleLike.fulfilled, (state, action) => {
        const comment = state.comments.find(
          (c) => c._id === action.payload.commentId,
        );
        if (comment) {
          comment.isLiked = action.payload.isLiked;
          comment.likes = {
            length: action.payload.likeCount,
          };
        }
      })
      .addCase(toggleLike.rejected, (state, action) => {
        state.error = action.payload;
      });

    // Get comment replies
    builder
      .addCase(getCommentReplies.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCommentReplies.fulfilled, (state, action) => {
        state.loading = false;
        // Handle replies data
        state.currentComment = action.payload;
      })
      .addCase(getCommentReplies.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearMessage, clearError } = commentSlice.actions;
export default commentSlice.reducer;

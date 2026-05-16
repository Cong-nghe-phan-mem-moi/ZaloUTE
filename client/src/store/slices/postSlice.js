import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { postAPI } from '../../services/api'

const initialState = {
  posts: [],
  currentPost: null,
  likes: [],
  comments: [],
  loading: false,
  error: null,
  message: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
}

// 4.1 Tạo bài viết
export const createPost = createAsyncThunk(
  'posts/createPost',
  async (formDataOrContent, { rejectWithValue }) => {
    try {
      const response = await postAPI.createPost(formDataOrContent)
      return response.data.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Không thể tạo bài viết',
      )
    }
  },
)

// 4.4 Xem news feed
export const getNewsFeed = createAsyncThunk(
  'posts/getNewsFeed',
  async ({ page = 1, limit = 10 }, { rejectWithValue }) => {
    try {
      const response = await postAPI.getNewsFeed(page, limit)
      return response.data.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Không thể tải news feed',
      )
    }
  },
)

// Get single post
export const getPost = createAsyncThunk(
  'posts/getPost',
  async (postId, { rejectWithValue }) => {
    try {
      const response = await postAPI.getPost(postId)
      return response.data.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Không thể tải bài viết',
      )
    }
  },
)

// 4.2 Chỉnh sửa bài viết
export const updatePost = createAsyncThunk(
  'posts/updatePost',
  async ({ postId, formData, content, media }, { rejectWithValue }) => {
    try {
      let response;
      // If formData is provided, use it directly
      if (formData) {
        response = await postAPI.updatePost(postId, formData);
      } else {
        // Otherwise, use content and media
        response = await postAPI.updatePostOld(postId, content, media);
      }
      return response.data.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Không thể chỉnh sửa bài viết',
      )
    }
  },
)

// 4.3 Xóa bài viết
export const deletePost = createAsyncThunk(
  'posts/deletePost',
  async (postId, { rejectWithValue }) => {
    try {
      await postAPI.deletePost(postId)
      return postId
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Không thể xóa bài viết',
      )
    }
  },
)

// Like/Unlike post
export const toggleLike = createAsyncThunk(
  'posts/toggleLike',
  async (postId, { rejectWithValue }) => {
    try {
      const response = await postAPI.toggleLike(postId)
      return response.data.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Không thể thích bài viết',
      )
    }
  },
)

// 4.5 Xem danh sách like
export const getPostLikes = createAsyncThunk(
  'posts/getPostLikes',
  async ({ postId, page = 1, limit = 10 }, { rejectWithValue }) => {
    try {
      const response = await postAPI.getPostLikes(postId, page, limit)
      return response.data.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Không thể tải danh sách like',
      )
    }
  },
)

// 4.6 Xem danh sách bình luận
export const getPostComments = createAsyncThunk(
  'posts/getPostComments',
  async ({ postId, page = 1, limit = 10 }, { rejectWithValue }) => {
    try {
      const response = await postAPI.getPostComments(postId, page, limit)
      return response.data.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Không thể tải danh sách bình luận',
      )
    }
  },
)

// Search posts
export const searchPosts = createAsyncThunk(
  'posts/searchPosts',
  async ({ keyword, page = 1, limit = 10 }, { rejectWithValue }) => {
    try {
      const response = await postAPI.searchPosts(keyword, page, limit)
      return response.data.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Không thể tìm kiếm bài viết',
      )
    }
  },
)

// Get posts by author
export const getPostsByAuthor = createAsyncThunk(
  'posts/getPostsByAuthor',
  async ({ authorId, page = 1, limit = 10 }, { rejectWithValue }) => {
    try {
      const response = await postAPI.getPostsByAuthor(authorId, page, limit)
      return response.data.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Không thể tải bài viết của tác giả',
      )
    }
  },
)

const postSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    clearMessage: (state) => {
      state.message = null
    },
    resetPosts: () => ({ ...initialState }),
  },
  extraReducers: (builder) => {
    builder
      // Create Post
      .addCase(createPost.pending, (state) => {
        state.loading = true
        state.error = null
        state.message = null
      })
      .addCase(createPost.fulfilled, (state, action) => {
        state.loading = false
        state.posts.unshift(action.payload)
        state.message = 'Tạo bài viết thành công'
      })
      .addCase(createPost.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // Get News Feed
      .addCase(getNewsFeed.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getNewsFeed.fulfilled, (state, action) => {
        state.loading = false
        // If page is 1, replace posts; otherwise append
        if (action.meta.arg.page === 1) {
          state.posts = action.payload.posts
        } else {
          state.posts = [...state.posts, ...action.payload.posts]
        }
        state.pagination = action.payload.pagination
      })
      .addCase(getNewsFeed.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // Get Single Post
      .addCase(getPost.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getPost.fulfilled, (state, action) => {
        state.loading = false
        state.currentPost = action.payload
      })
      .addCase(getPost.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // Update Post
      .addCase(updatePost.pending, (state) => {
        state.loading = true
        state.error = null
        state.message = null
      })
      .addCase(updatePost.fulfilled, (state, action) => {
        state.loading = false
        const index = state.posts.findIndex((p) => p._id === action.payload._id)
        if (index !== -1) {
          state.posts[index] = action.payload
        }
        state.currentPost = action.payload
        state.message = 'Chỉnh sửa bài viết thành công'
      })
      .addCase(updatePost.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // Delete Post
      .addCase(deletePost.pending, (state) => {
        state.loading = true
        state.error = null
        state.message = null
      })
      .addCase(deletePost.fulfilled, (state, action) => {
        state.loading = false
        state.posts = state.posts.filter((p) => p._id !== action.payload)
        state.message = 'Xóa bài viết thành công'
      })
      .addCase(deletePost.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // Toggle Like
      .addCase(toggleLike.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(toggleLike.fulfilled, (state, action) => {
        state.loading = false
        const postId = action.payload.postId
        const post = state.posts.find((p) => p._id === postId)
        if (post) {
          if (action.payload.isLiked) {
            post.likes.push(action.payload)
          } else {
            post.likes = post.likes.filter((l) => l._id !== action.payload.userId)
          }
        }
      })
      .addCase(toggleLike.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // Get Post Likes
      .addCase(getPostLikes.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getPostLikes.fulfilled, (state, action) => {
        state.loading = false
        state.likes = action.payload.likes
        state.pagination = action.payload.pagination
      })
      .addCase(getPostLikes.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // Get Post Comments
      .addCase(getPostComments.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getPostComments.fulfilled, (state, action) => {
        state.loading = false
        state.comments = action.payload.comments
        state.pagination = action.payload.pagination
      })
      .addCase(getPostComments.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // Search Posts
      .addCase(searchPosts.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(searchPosts.fulfilled, (state, action) => {
        state.loading = false
        state.posts = action.payload.posts
        state.pagination = action.payload.pagination
      })
      .addCase(searchPosts.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // Get Posts by Author
      .addCase(getPostsByAuthor.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getPostsByAuthor.fulfilled, (state, action) => {
        state.loading = false
        state.posts = action.payload.posts
        state.pagination = action.payload.pagination
      })
      .addCase(getPostsByAuthor.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

export const { clearError, clearMessage, resetPosts } = postSlice.actions
export default postSlice.reducer

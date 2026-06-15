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

const resizeLikes = (likes = [], likeCount = 0) => {
  if (!Array.isArray(likes)) {
    return Array.from({ length: likeCount }, (_, index) => ({
      _id: `like-${index}`,
    }))
  }

  if (likes.length > likeCount) {
    return likes.slice(0, likeCount)
  }

  if (likes.length < likeCount) {
    return [
      ...likes,
      ...Array.from({ length: likeCount - likes.length }, (_, index) => ({
        _id: `like-${likes.length + index}`,
      })),
    ]
  }

  return likes
}

const applyLikeState = (post, likeState) => {
  if (!post || !likeState) return

  post.isLiked = likeState.isLiked
  post.likes = resizeLikes(post.likes, likeState.likeCount)
  post.reactionCount = likeState.reactionCount ?? likeState.likeCount
  post.reactionSummary = likeState.reactionSummary
  post.currentUserReaction = likeState.currentUserReaction
}

const applyShareState = (post, shareState) => {
  if (!post || !shareState) return

  post.shareCount = shareState.shareCount
}

// Create post
export const createPost = createAsyncThunk(
  'posts/createPost',
  async (formDataOrContent, { rejectWithValue }) => {
    try {
      const response = await postAPI.createPost(formDataOrContent)
      return response.data.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Unable to create post',
      )
    }
  },
)

// 4.4 View news feed
export const getNewsFeed = createAsyncThunk(
  'posts/getNewsFeed',
  async ({ page = 1, limit = 10 }, { rejectWithValue }) => {
    try {
      const response = await postAPI.getNewsFeed(page, limit)
      return response.data.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Unable to load news feed',
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
        error.response?.data?.message || 'Unable to load post',
      )
    }
  },
)

// Update post
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
        error.response?.data?.message || 'Unable to update post',
      )
    }
  },
)

// Delete post
export const deletePost = createAsyncThunk(
  'posts/deletePost',
  async (postId, { rejectWithValue }) => {
    try {
      await postAPI.deletePost(postId)
      return postId
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Unable to delete post',
      )
    }
  },
)

// Like/Unlike post
export const toggleLike = createAsyncThunk(
  'posts/toggleLike',
  async ({ postId, reactionType = 'like' }, { rejectWithValue }) => {
    try {
      const response = await postAPI.toggleLike(postId, reactionType)
      return response.data.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Unable to like post',
      )
    }
  },
)

export const sharePost = createAsyncThunk(
  'posts/sharePost',
  async ({ postId, caption = '', target = 'timeline', conversationId = null }, { rejectWithValue }) => {
    try {
      const response = await postAPI.sharePost(postId, {
        caption,
        target,
        conversationId,
      })
      return response.data.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Unable to share post',
      )
    }
  },
)

// Get post likes
export const getPostLikes = createAsyncThunk(
  'posts/getPostLikes',
  async ({ postId, page = 1, limit = 10 }, { rejectWithValue }) => {
    try {
      const response = await postAPI.getPostLikes(postId, page, limit)
      return response.data.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Unable to load likes',
      )
    }
  },
)

// Get post comments
export const getPostComments = createAsyncThunk(
  'posts/getPostComments',
  async ({ postId, page = 1, limit = 10 }, { rejectWithValue }) => {
    try {
      const response = await postAPI.getPostComments(postId, page, limit)
      return response.data.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Unable to load comments',
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
        error.response?.data?.message || 'Unable to search posts',
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
        error.response?.data?.message || 'Unable to load posts by author',
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
        state.message = 'Post created successfully'
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
        const index = state.posts.findIndex((p) => p._id === action.payload._id)
        if (index !== -1) {
          state.posts[index] = action.payload
        }
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
        state.message = 'Post updated successfully'
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
        state.message = 'Post deleted successfully'
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
        applyLikeState(post, action.payload)

        if (state.currentPost?._id === postId) {
          applyLikeState(state.currentPost, action.payload)
        }
      })
      .addCase(toggleLike.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // Share Post
      .addCase(sharePost.pending, (state) => {
        state.loading = true
        state.error = null
        state.message = null
      })
      .addCase(sharePost.fulfilled, (state, action) => {
        state.loading = false
        const postId = action.payload.postId
        const post = state.posts.find((p) => p._id === postId)
        applyShareState(post, action.payload)

        if (state.currentPost?._id === postId) {
          applyShareState(state.currentPost, action.payload)
        }

        if (action.payload.target === 'timeline' && action.payload.sharedPost) {
          state.posts.unshift(action.payload.sharedPost)
        }

        state.message =
          action.payload.target === 'message'
            ? 'Post shared to message'
            : 'Post shared successfully'
      })
      .addCase(sharePost.rejected, (state, action) => {
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
        if (action.meta.arg.page === 1) {
          state.posts = action.payload.posts
        } else {
          state.posts = [...state.posts, ...action.payload.posts]
        }
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

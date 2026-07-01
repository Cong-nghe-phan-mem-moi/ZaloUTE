import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

const initialState = {
  profile: null,
  loading: false,
  error: null,
}

export const fetchUserProfile = createAsyncThunk(
  'user/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/profile')
      return response.data.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch profile',
      )
    }
  },
)

export const updateUserProfile = createAsyncThunk(
  'user/updateProfile',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await api.put('/profile', formData)
      return response.data.data
    } catch (error) {
      const responseData = error.response?.data
      return rejectWithValue(
        responseData?.errors?.length
          ? {
              message: responseData.message || 'Validation failed',
              errors: responseData.errors,
            }
          : responseData?.message || 'Failed to update profile',
      )
    }
  },
)

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    clearProfile: (state) => {
      state.profile = null
      state.loading = false
      state.error = null
    },
    updateFriendStatus: (state, action) => {
      const { userId, isOnline, lastActive } = action.payload;
      if (!userId) return;
      if (state.profile && state.profile.friends) {
        state.profile.friends.forEach((friend) => {
          const friendId = friend.id || friend._id;
          if (friendId && friendId.toString() === userId.toString()) {
            friend.isOnline = isOnline;
            friend.lastActive = lastActive;
          }
        });
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.loading = false
        state.profile = action.payload
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(updateUserProfile.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.loading = false
        state.profile = action.payload
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

export const { clearError, clearProfile, updateFriendStatus } = userSlice.actions
export default userSlice.reducer

import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import {
  requestPasswordResetOtp,
  resetPassword,
  verifyPasswordResetOtp,
} from '../../services/api'

const getStoredResetToken = () => {
  if (typeof window === 'undefined') return ''
  return sessionStorage.getItem('resetToken') || ''
}

const initialState = {
  step: 'email',
  email: '',
  otp: '',
  newPassword: '',
  confirmPassword: '',
  resetToken: getStoredResetToken(),
  loading: false,
  error: null,
  message: null,
}

export const requestResetOtp = createAsyncThunk(
  'forgotPassword/requestOtp',
  async (email, { rejectWithValue }) => {
    try {
      const response = await requestPasswordResetOtp(email)
      return response.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Không thể gửi OTP. Vui lòng thử lại.',
      )
    }
  },
)

export const verifyResetOtp = createAsyncThunk(
  'forgotPassword/verifyOtp',
  async ({ email, otp }, { rejectWithValue }) => {
    try {
      const response = await verifyPasswordResetOtp(email, otp)
      return response.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Xác thực OTP thất bại.',
      )
    }
  },
)

export const submitResetPassword = createAsyncThunk(
  'forgotPassword/resetPassword',
  async ({ newPassword, resetToken }, { rejectWithValue }) => {
    try {
      const response = await resetPassword(newPassword, resetToken)
      return response.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Đặt lại mật khẩu thất bại.',
      )
    }
  },
)

const forgotPasswordSlice = createSlice({
  name: 'forgotPassword',
  initialState,
  reducers: {
    setField: (state, action) => {
      const { field, value } = action.payload
      state[field] = value
    },
    setStep: (state, action) => {
      state.step = action.payload
    },
    clearStatus: (state) => {
      state.error = null
      state.message = null
    },
    setError: (state, action) => {
      state.error = action.payload
    },
    resetState: () => {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('resetToken')
      }
      return { ...initialState, resetToken: '' }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(requestResetOtp.pending, (state) => {
        state.loading = true
        state.error = null
        state.message = null
      })
      .addCase(requestResetOtp.fulfilled, (state, action) => {
        state.loading = false
        state.step = 'otp'
        state.message = action.payload?.message || 'OTP đã được gửi.'
      })
      .addCase(requestResetOtp.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(verifyResetOtp.pending, (state) => {
        state.loading = true
        state.error = null
        state.message = null
      })
      .addCase(verifyResetOtp.fulfilled, (state, action) => {
        state.loading = false
        state.step = 'reset'
        state.message = action.payload?.message || 'Xác thực OTP thành công.'
        state.resetToken = action.payload?.data?.resetToken || ''
        if (state.resetToken && typeof window !== 'undefined') {
          sessionStorage.setItem('resetToken', state.resetToken)
        }
      })
      .addCase(verifyResetOtp.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(submitResetPassword.pending, (state) => {
        state.loading = true
        state.error = null
        state.message = null
      })
      .addCase(submitResetPassword.fulfilled, (state, action) => {
        state.loading = false
        state.step = 'success'
        state.message =
          action.payload?.message || 'Đặt lại mật khẩu thành công.'
        state.resetToken = ''
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('resetToken')
        }
      })
      .addCase(submitResetPassword.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

export const { setField, setStep, clearStatus, setError, resetState } =
  forgotPasswordSlice.actions

export default forgotPasswordSlice.reducer

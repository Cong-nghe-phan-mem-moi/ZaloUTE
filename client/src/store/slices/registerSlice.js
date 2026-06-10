import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { registerAPI } from '../../services/api'

const initialState = {
  step: 'register',
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
  otp: '',
  loading: false,
  error: null,
  message: null,
}

export const submitRegister = createAsyncThunk(
  'register/submitRegister',
  async ({ fullName, email, password }, { rejectWithValue }) => {
    try {
      const response = await registerAPI.register(fullName, email, password)
      return response.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Registration failed. Please try again.',
      )
    }
  },
)

export const submitVerifyOtp = createAsyncThunk(
  'register/verifyOtp',
  async ({ email, otp }, { rejectWithValue }) => {
    try {
      const response = await registerAPI.verifyOTP(email, otp)
      return response.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'OTP verification failed.',
      )
    }
  },
)

const registerSlice = createSlice({
  name: 'register',
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
    resetState: () => ({ ...initialState }),
  },
  extraReducers: (builder) => {
    builder
      .addCase(submitRegister.pending, (state) => {
        state.loading = true
        state.error = null
        state.message = null
      })
      .addCase(submitRegister.fulfilled, (state, action) => {
        state.loading = false
        state.step = 'verify-otp'
        state.message = action.payload?.message || 'Registration successful! Please verify your OTP'
      })
      .addCase(submitRegister.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(submitVerifyOtp.pending, (state) => {
        state.loading = true
        state.error = null
        state.message = null
      })
      .addCase(submitVerifyOtp.fulfilled, (state, action) => {
        state.loading = false
        state.step = 'success'
        state.message = action.payload?.message || 'OTP verified successfully!'
      })
      .addCase(submitVerifyOtp.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

export const { setField, setStep, clearStatus, setError, resetState } =
  registerSlice.actions

export default registerSlice.reducer

import { configureStore } from '@reduxjs/toolkit'
import forgotPasswordReducer from './slices/forgotPasswordSlice'

export const store = configureStore({
  reducer: {
    forgotPassword: forgotPasswordReducer,
  },
})

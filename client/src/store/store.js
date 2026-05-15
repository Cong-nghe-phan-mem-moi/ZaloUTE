import { configureStore } from '@reduxjs/toolkit'
import forgotPasswordReducer from './slices/forgotPasswordSlice'
import registerReducer from './slices/registerSlice'
import uiReducer from './slices/uiSlice'
import userReducer from './slices/userSlice'

export const store = configureStore({
  reducer: {
    forgotPassword: forgotPasswordReducer,
    register: registerReducer,
    ui: uiReducer,
    user: userReducer,
  },
})

import { configureStore } from "@reduxjs/toolkit";
import forgotPasswordReducer from "./slices/forgotPasswordSlice";
import registerReducer from "./slices/registerSlice";
import uiReducer from "./slices/uiSlice";
import userReducer from "./slices/userSlice";
import postReducer from "./slices/postSlice";
import commentReducer from "./slices/commentSlice";
import chatReducer from "./slices/chatSlice";

export const store = configureStore({
  reducer: {
    forgotPassword: forgotPasswordReducer,
    register: registerReducer,
    ui: uiReducer,
    user: userReducer,
    posts: postReducer,
    comments: commentReducer,
    chat: chatReducer,
  },
});

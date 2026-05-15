import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  currentPage: "register",
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setCurrentPage: (state, action) => {
      state.currentPage = action.payload;
    },
    navigateTo: (state, action) => {
      state.currentPage = action.payload;
    },
  },
});

export const { setCurrentPage, navigateTo } = uiSlice.actions;
export default uiSlice.reducer;

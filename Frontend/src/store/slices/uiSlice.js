import { createSlice } from "@reduxjs/toolkit";

const slice = createSlice({
  name: "ui",
  initialState: {
    sidebarCollapsed: false,
    taskModalId: null,
    searchOpen: false,
  },
  reducers: {
    toggleSidebar(state) { state.sidebarCollapsed = !state.sidebarCollapsed; },
    setSidebar(state, { payload }) { state.sidebarCollapsed = payload; },
    openTask(state, { payload }) { state.taskModalId = payload; },
    closeTask(state) { state.taskModalId = null; },
    openSearch(state) { state.searchOpen = true; },
    closeSearch(state) { state.searchOpen = false; },
  },
});

export const { toggleSidebar, setSidebar, openTask, closeTask, openSearch, closeSearch } = slice.actions;
export default slice.reducer;

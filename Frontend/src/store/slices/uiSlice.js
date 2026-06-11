import { createSlice } from "@reduxjs/toolkit";

const slice = createSlice({
  name: "ui",
  initialState: {
    sidebarCollapsed: false,
    taskModalId: null,
  },
  reducers: {
    toggleSidebar(state) { state.sidebarCollapsed = !state.sidebarCollapsed; },
    setSidebar(state, { payload }) { state.sidebarCollapsed = payload; },
    openTask(state, { payload }) { state.taskModalId = payload; },
    closeTask(state) { state.taskModalId = null; },
  },
});

export const { toggleSidebar, setSidebar, openTask, closeTask } = slice.actions;
export default slice.reducer;

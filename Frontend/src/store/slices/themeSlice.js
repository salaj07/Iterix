import { createSlice } from "@reduxjs/toolkit";

const initial = { mode: localStorage.getItem("Iterix-theme") || "dark" };

const slice = createSlice({
  name: "theme",
  initialState: initial,
  reducers: {
    setTheme(state, { payload }) {
      state.mode = payload;
      localStorage.setItem("Iterix-theme", payload);
      document.documentElement.classList.toggle("dark", payload === "dark");
    },
    toggleTheme(state) {
      state.mode = state.mode === "dark" ? "light" : "dark";
      localStorage.setItem("Iterix-theme", state.mode);
      document.documentElement.classList.toggle("dark", state.mode === "dark");
    },
  },
});

export const { setTheme, toggleTheme } = slice.actions;
export default slice.reducer;

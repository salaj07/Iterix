import { createSlice } from "@reduxjs/toolkit";

const getSystemTheme = () => {
  if (typeof window === "undefined" || !window.matchMedia) return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

const readStoredTheme = () => {
  try {
    const savedTheme = localStorage.getItem("Iterix-theme");
    if (savedTheme === "dark" || savedTheme === "light") return savedTheme;
  } catch {}
  return getSystemTheme();
};

const applyTheme = (mode) => {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", mode === "dark");
  document.documentElement.style.colorScheme = mode;
};

const initialTheme = readStoredTheme();
applyTheme(initialTheme);

const initial = { mode: initialTheme };

const slice = createSlice({
  name: "theme",
  initialState: initial,
  reducers: {
    setTheme(state, { payload }) {
      state.mode = payload;
      localStorage.setItem("Iterix-theme", payload);
      applyTheme(payload);
    },
    toggleTheme(state) {
      state.mode = state.mode === "dark" ? "light" : "dark";
      localStorage.setItem("Iterix-theme", state.mode);
      applyTheme(state.mode);
    },
  },
});

export const { setTheme, toggleTheme } = slice.actions;
export default slice.reducer;

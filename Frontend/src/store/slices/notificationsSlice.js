import { createSlice } from "@reduxjs/toolkit";
import { uid } from "@/lib/uid";

const slice = createSlice({
  name: "notifications",
  initialState: {
    items: [], // [{id, userId, type, title, body, at, read}]
  },
  reducers: {
    push: {
      reducer(state, { payload }) { state.items.unshift(payload); },
      prepare(input) {
        return { payload: { id: uid(), at: Date.now(), read: false, ...input } };
      },
    },
    markRead(state, { payload }) {
      const n = state.items.find(i => i.id === payload);
      if (n) n.read = true;
    },
    markAllRead(state, { payload }) {
      state.items.forEach(i => { if (i.userId === payload) i.read = true; });
    },
    clearAll(state, { payload }) {
      state.items = state.items.filter(i => i.userId !== payload);
    },
  },
});

export const { push, markRead, markAllRead, clearAll } = slice.actions;
export default slice.reducer;

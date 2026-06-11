import { createSlice } from "@reduxjs/toolkit";
import { uid } from "@/lib/uid";

const slice = createSlice({
  name: "workspace",
  initialState: {
    workspaces: [], // [{id, name, ownerId}]
    currentWorkspaceId: null,
  },
  reducers: {
    createWorkspace: {
      reducer(state, { payload }) {
        state.workspaces.push(payload);
        state.currentWorkspaceId = payload.id;
      },
      prepare(input) {
        return { payload: { id: uid(), createdAt: Date.now(), ...input } };
      },
    },
    setCurrentWorkspace(state, { payload }) {
      state.currentWorkspaceId = payload;
    },
    seedWorkspace(state, { payload }) {
      if (!state.workspaces.find((w) => w.id === payload.id)) {
        state.workspaces.push(payload);
      }
      state.currentWorkspaceId = payload.id;
    },
  },
});

export const { createWorkspace, setCurrentWorkspace, seedWorkspace } = slice.actions;
export default slice.reducer;

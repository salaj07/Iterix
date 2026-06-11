import { createSlice } from "@reduxjs/toolkit";
import { uid } from "@/lib/uid";

const slice = createSlice({
  name: "sprints",
  initialState: {
    sprints: [], // [{id, projectId, name, goal, status, startDate, endDate}]
  },
  reducers: {
    createSprint: {
      reducer(state, { payload }) { state.sprints.push(payload); },
      prepare(input) {
        return { payload: { id: uid(), status: "planned", ...input } };
      },
    },
    seedSprint(state, { payload }) {
      if (!state.sprints.find(s => s.id === payload.id)) state.sprints.push(payload);
    },
    startSprint(state, { payload }) {
      const s = state.sprints.find(x => x.id === payload);
      if (s) s.status = "active";
    },
    completeSprint(state, { payload }) {
      const s = state.sprints.find(x => x.id === payload);
      if (s) s.status = "completed";
    },
    updateSprint(state, { payload }) {
      const s = state.sprints.find(x => x.id === payload.id);
      if (s) Object.assign(s, payload);
    },
  },
});

export const { createSprint, seedSprint, startSprint, completeSprint, updateSprint } = slice.actions;
export default slice.reducer;

import { createSlice } from "@reduxjs/toolkit";
import { uid } from "@/lib/uid";

const slice = createSlice({
  name: "projects",
  initialState: {
    projects: [], // [{id, orgId, name, key, description, teamLeadId, memberIds, createdAt}]
  },
  reducers: {
    createProject: {
      reducer(state, { payload }) { state.projects.push(payload); },
      prepare(input) {
        return { payload: { id: uid(), createdAt: Date.now(), memberIds: [], ...input } };
      },
    },
    seedProject(state, { payload }) {
      if (!state.projects.find(p => p.id === payload.id)) state.projects.push(payload);
    },
    updateProject(state, { payload }) {
      const p = state.projects.find(x => x.id === payload.id);
      if (p) Object.assign(p, payload);
    },
    assignTeamLead(state, { payload }) {
      const p = state.projects.find(x => x.id === payload.projectId);
      if (p) p.teamLeadId = payload.leadId;
    },
    addProjectMember(state, { payload }) {
      const p = state.projects.find(x => x.id === payload.projectId);
      if (p && !p.memberIds.includes(payload.memberId)) p.memberIds.push(payload.memberId);
    },
    removeProjectMember(state, { payload }) {
      const p = state.projects.find(x => x.id === payload.projectId);
      if (p) p.memberIds = p.memberIds.filter(id => id !== payload.memberId);
    },
    deleteProject(state, { payload }) {
      state.projects = state.projects.filter(p => p.id !== payload);
    },
  },
});

export const { createProject, seedProject, updateProject, assignTeamLead, addProjectMember, removeProjectMember, deleteProject } = slice.actions;
export default slice.reducer;

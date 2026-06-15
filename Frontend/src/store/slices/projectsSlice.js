import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as projectApi from "@/services/project.api";

/* ─── Async Thunks ────────────────────────────────────────────────────── */

/** Fetch all projects for the logged-in user */
export const fetchProjects = createAsyncThunk(
  "projects/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await projectApi.getUserProjects();
      return res.data; // { success, data: [...projects or project memberships] }
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: "Failed to load projects" });
    }
  }
);

/** Create a new project */
export const createProjectAsync = createAsyncThunk(
  "projects/create",
  async (data, { rejectWithValue }) => {
    try {
      const res = await projectApi.createProject(data);
      return res.data; // { success, data: project }
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: "Failed to create project" });
    }
  }
);

/** Archive a project */
export const archiveProjectAsync = createAsyncThunk(
  "projects/archive",
  async (projectId, { rejectWithValue }) => {
    try {
      const res = await projectApi.archiveProject(projectId);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: "Failed to archive project" });
    }
  }
);

/** Fetch all members of a project */
export const fetchProjectMembers = createAsyncThunk(
  "projects/fetchMembers",
  async (projectId, { rejectWithValue }) => {
    try {
      const res = await projectApi.getProjectMembers(projectId);
      return { projectId, members: res.data.data || res.data };
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: "Failed to load project members" });
    }
  }
);

/** Add a member to a project */
export const addProjectMemberAsync = createAsyncThunk(
  "projects/addMember",
  async ({ projectId, userId, role }, { rejectWithValue }) => {
    try {
      const res = await projectApi.addProjectMember(projectId, userId, role);
      return { projectId, data: res.data.data || res.data };
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: "Failed to add project member" });
    }
  }
);

/** Remove a member from a project */
export const removeProjectMemberAsync = createAsyncThunk(
  "projects/removeMember",
  async ({ projectId, userId }, { rejectWithValue }) => {
    try {
      const res = await projectApi.removeProjectMember(projectId, userId);
      return { projectId, userId, data: res.data.data || res.data };
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: "Failed to remove project member" });
    }
  }
);

/** Update a project member's role */
export const updateProjectMemberRoleAsync = createAsyncThunk(
  "projects/updateMemberRole",
  async ({ projectId, userId, role }, { rejectWithValue }) => {
    try {
      const res = await projectApi.updateProjectMemberRole(projectId, userId, role);
      return { projectId, userId, role, data: res.data.data || res.data };
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: "Failed to update project member role" });
    }
  }
);

/* ─── Slice ───────────────────────────────────────────────────────────── */
const slice = createSlice({
  name: "projects",
  initialState: {
    projects: [],
    currentProjectId: null,
    projectMembers: [], // members of currently selected project
    loading: false,
    error: null,
  },
  reducers: {
    setCurrentProjectId(state, { payload }) {
      state.currentProjectId = payload;
      if (payload) {
        localStorage.setItem(`Iterix-current-project-global`, payload);
      } else {
        localStorage.removeItem(`Iterix-current-project-global`);
      }
    },
    /** Synchronous local create — kept for optimistic UI */
    createProject: {
      reducer(state, { payload }) {
        const mapped = { ...payload, id: payload.id || payload._id };
        state.projects.push(mapped);
      },
      prepare(input) {
        return {
          payload: {
            id: `local-${Date.now()}`,
            createdAt: Date.now(),
            memberIds: [],
            ...input,
          },
        };
      },
    },
    /** Keep for backwards-compat with seed data */
    seedProject(state, { payload }) {
      const id = payload.id || payload._id;
      if (!state.projects.find((p) => p.id === id || p._id === id)) {
        state.projects.push({ ...payload, id });
      }
    },
    updateProject(state, { payload }) {
      const id = payload.id || payload._id;
      const idx = state.projects.findIndex((p) => p.id === id || p._id === id);
      if (idx !== -1) {
        Object.assign(state.projects[idx], { ...payload, id });
      }
    },
    deleteProject(state, { payload }) {
      state.projects = state.projects.filter((p) => p.id !== payload && p._id !== payload);
      if (state.currentProjectId === payload) {
        state.currentProjectId = state.projects[0]?.id || null;
      }
    },
    addProjectMember(state, { payload }) {
      const projectId = payload.projectId;
      const p = state.projects.find((x) => x.id === projectId || x._id === projectId);
      if (p) {
        const memberIds = p.memberIds || [];
        if (!memberIds.includes(payload.memberId)) {
          p.memberIds = [...memberIds, payload.memberId];
        }
      }
    },
    removeProjectMember(state, { payload }) {
      const projectId = payload.projectId;
      const p = state.projects.find((x) => x.id === projectId || x._id === projectId);
      if (p && p.memberIds) {
        p.memberIds = p.memberIds.filter((id) => id !== payload.memberId);
      }
    },
  },
  extraReducers: (builder) => {
    /* fetchProjects */
    builder
      .addCase(fetchProjects.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchProjects.fulfilled, (state, { payload }) => {
        state.loading = false;
        const rawData = payload.data || [];
        state.projects = rawData.map((item) => {
          if (item && item.project && typeof item.project === "object") {
            const proj = item.project;
            return {
              ...proj,
              id: proj.id || proj._id,
              memberRole: item.role,
              teamLeadId: proj.createdBy || "",
              memberIds: proj.memberIds || [item.user]
            };
          }
          return {
            ...item,
            id: item.id || item._id,
            teamLeadId: item.createdBy || item.teamLeadId || "",
            memberIds: item.memberIds || []
          };
        });

        // Set default currentProjectId if not set or invalid
        const savedGlobal = localStorage.getItem(`Iterix-current-project-global`);
        const exists = state.projects.some(p => p.id === savedGlobal);
        if (exists) {
          state.currentProjectId = savedGlobal;
        } else if (state.projects.length > 0) {
          state.currentProjectId = state.projects[0].id;
        } else {
          state.currentProjectId = null;
        }
      })
      .addCase(fetchProjects.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload?.message || "Failed to load projects";
      });

    /* createProject */
    builder
      .addCase(createProjectAsync.pending, (state) => { state.loading = true; })
      .addCase(createProjectAsync.fulfilled, (state, { payload }) => {
        state.loading = false;
        const proj = payload.data;
        if (proj) {
          const mapped = {
            ...proj,
            id: proj.id || proj._id,
            teamLeadId: proj.createdBy || "",
            memberIds: proj.memberIds || [proj.createdBy]
          };
          state.projects.push(mapped);
          state.currentProjectId = mapped.id;
        }
      })
      .addCase(createProjectAsync.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload?.message;
      });

    /* archiveProject */
    builder
      .addCase(archiveProjectAsync.fulfilled, (state, { payload }) => {
        const updated = payload.data;
        if (updated) {
          const idx = state.projects.findIndex((p) => p.id === updated._id || p._id === updated._id);
          if (idx !== -1) {
            state.projects[idx] = {
              ...updated,
              id: updated.id || updated._id,
              teamLeadId: updated.createdBy || updated.teamLeadId || "",
              memberIds: updated.memberIds || []
            };
          }
        }
      });

    /* fetchProjectMembers */
    builder
      .addCase(fetchProjectMembers.fulfilled, (state, { payload }) => {
        if (state.currentProjectId === payload.projectId) {
          state.projectMembers = payload.members;
        }
        // Update memberIds locally
        const proj = state.projects.find(p => p.id === payload.projectId);
        if (proj) {
          proj.memberIds = payload.members.map(m => m.id || m.userId || m.user?._id || m.user);
        }
      });

    /* addProjectMemberAsync */
    builder
      .addCase(addProjectMemberAsync.fulfilled, (state, { payload }) => {
        // Fetch project members again or add local item
      });

    /* removeProjectMemberAsync */
    builder
      .addCase(removeProjectMemberAsync.fulfilled, (state, { payload }) => {
        if (state.currentProjectId === payload.projectId) {
          state.projectMembers = state.projectMembers.filter(m => (m.id || m.userId || m.user?._id || m.user) !== payload.userId);
        }
        const proj = state.projects.find(p => p.id === payload.projectId);
        if (proj && proj.memberIds) {
          proj.memberIds = proj.memberIds.filter(id => id !== payload.userId);
        }
      });

    /* updateProjectMemberRoleAsync */
    builder
      .addCase(updateProjectMemberRoleAsync.fulfilled, (state, { payload }) => {
        if (state.currentProjectId === payload.projectId) {
          const m = state.projectMembers.find(x => (x.id || x.userId || x.user?._id || x.user) === payload.userId);
          if (m) {
            m.role = payload.role;
          }
        }
      });
  },
});

export const {
  createProject, seedProject, updateProject, deleteProject,
  addProjectMember, removeProjectMember, setCurrentProjectId
} = slice.actions;
export default slice.reducer;

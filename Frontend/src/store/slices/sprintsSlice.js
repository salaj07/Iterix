import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as sprintApi from "@/services/sprint.api";

/* ─── Mapping Helper ────────────────────────────────────────────────── */

const mapSprintFromBackend = (s) => {
  if (!s) return s;
  
  let status = "planned";
  if (s.status === "ACTIVE") status = "active";
  else if (s.status === "COMPLETED") status = "completed";
  else if (s.status === "PLANNED") status = "planned";
  else status = s.status || "planned";

  return {
    ...s,
    id: s.id || s._id,
    projectId: s.projectId || (s.project && (typeof s.project === "object" ? s.project._id || s.project.id : s.project)),
    status,
  };
};

/* ─── Async Thunks ────────────────────────────────────────────────────── */

/** Fetch all sprints for a project */
export const fetchSprints = createAsyncThunk(
  "sprints/fetchByProject",
  async (projectId, { rejectWithValue }) => {
    try {
      const res = await sprintApi.getProjectSprints(projectId);
      return res.data; // { success, data: [...sprints] }
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: "Failed to load sprints" });
    }
  }
);

/** Create a new sprint */
export const createSprintAsync = createAsyncThunk(
  "sprints/create",
  async (data, { rejectWithValue }) => {
    try {
      const res = await sprintApi.createSprint(data);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: "Failed to create sprint" });
    }
  }
);

/** Start a sprint */
export const startSprintAsync = createAsyncThunk(
  "sprints/start",
  async (sprintId, { rejectWithValue }) => {
    try {
      const res = await sprintApi.startSprint(sprintId);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: "Failed to start sprint" });
    }
  }
);

/** Complete a sprint */
export const completeSprintAsync = createAsyncThunk(
  "sprints/complete",
  async (sprintId, { rejectWithValue }) => {
    try {
      const res = await sprintApi.completeSprint(sprintId);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: "Failed to complete sprint" });
    }
  }
);

/** Delete a sprint */
export const deleteSprintAsync = createAsyncThunk(
  "sprints/delete",
  async (sprintId, { rejectWithValue }) => {
    try {
      const res = await sprintApi.deleteSprint(sprintId);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: "Failed to delete sprint" });
    }
  }
);

/* ─── Slice ───────────────────────────────────────────────────────────── */
const slice = createSlice({
  name: "sprints",
  initialState: {
    sprints: [],
    loading: false,
    error: null,
  },
  reducers: {
    /** Synchronous reducers — kept for optimistic UI and backwards compat */
    createSprint: {
      reducer(state, { payload }) {
        const mapped = mapSprintFromBackend(payload);
        state.sprints.push(mapped);
      },
      prepare(input) {
        return { payload: { id: `local-${Date.now()}`, status: "planned", ...input } };
      },
    },
    startSprint(state, { payload }) {
      const s = state.sprints.find((x) => x.id === payload || x._id === payload);
      if (s) s.status = "active";
    },
    completeSprint(state, { payload }) {
      const s = state.sprints.find((x) => x.id === payload || x._id === payload);
      if (s) s.status = "completed";
    },
    /** Legacy seed support */
    seedSprint(state, { payload }) {
      const id = payload.id || payload._id;
      if (!state.sprints.find((s) => s.id === id || s._id === id)) {
        state.sprints.push(mapSprintFromBackend({ ...payload, id }));
      }
    },
    updateSprint(state, { payload }) {
      const id = payload.id || payload._id;
      const idx = state.sprints.findIndex((s) => s.id === id || s._id === id);
      if (idx !== -1) {
        Object.assign(state.sprints[idx], mapSprintFromBackend({ ...payload, id }));
      }
    },
  },
  extraReducers: (builder) => {
    /* fetchSprints */
    builder
      .addCase(fetchSprints.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchSprints.fulfilled, (state, { payload, meta }) => {
        state.loading = false;
        const projectId = meta.arg;
        const incoming = payload.data || [];
        const otherSprints = state.sprints.filter((s) => s.projectId !== projectId && s.project !== projectId);
        const mappedIncoming = incoming.map((s) => mapSprintFromBackend(s));
        state.sprints = [...otherSprints, ...mappedIncoming];
      })
      .addCase(fetchSprints.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload?.message;
      });

    /* createSprint */
    builder
      .addCase(createSprintAsync.pending, (state) => { state.loading = true; })
      .addCase(createSprintAsync.fulfilled, (state, { payload }) => {
        state.loading = false;
        const sprint = payload.data;
        if (sprint) {
          state.sprints.push(mapSprintFromBackend(sprint));
        }
      })
      .addCase(createSprintAsync.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload?.message;
      });

    /* startSprint */
    builder
      .addCase(startSprintAsync.fulfilled, (state, { payload }) => {
        const updated = payload.data;
        if (updated) {
          const idx = state.sprints.findIndex((s) => s.id === updated._id || s._id === updated._id);
          if (idx !== -1) {
            state.sprints[idx] = mapSprintFromBackend(updated);
          }
        }
      });

    /* completeSprint */
    builder
      .addCase(completeSprintAsync.fulfilled, (state, { payload }) => {
        const updated = payload.data;
        if (updated) {
          const idx = state.sprints.findIndex((s) => s.id === updated._id || s._id === updated._id);
          if (idx !== -1) {
            state.sprints[idx] = mapSprintFromBackend(updated);
          }
        }
      });

    /* deleteSprint */
    builder
      .addCase(deleteSprintAsync.fulfilled, (state, { payload }) => {
        const id = payload.data?.sprintId;
        if (id) {
          state.sprints = state.sprints.filter(s => s.id !== id && s._id !== id);
        }
      });
  },
});

export const { createSprint, startSprint, completeSprint, seedSprint, updateSprint } = slice.actions;
export default slice.reducer;

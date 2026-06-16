import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as workspaceApi from "@/services/workspace.api";

/* ─── Async Thunks ────────────────────────────────────────────────────── */

/** Fetch all workspaces for the logged-in user */
export const fetchWorkspaces = createAsyncThunk(
  "workspace/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await workspaceApi.getUserWorkspaces();
      return res.data; // { success, data: [...workspaces] }
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: "Failed to load workspaces" });
    }
  }
);

/** Create a new workspace */
export const createWorkspaceAsync = createAsyncThunk(
  "workspace/create",
  async (data, { rejectWithValue }) => {
    try {
      const res = await workspaceApi.createWorkspace(data);
      return res.data; // { success, data: workspace }
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: "Failed to create workspace" });
    }
  }
);

/** Update workspace */
export const updateWorkspaceAsync = createAsyncThunk(
  "workspace/update",
  async ({ workspaceId, data }, { rejectWithValue }) => {
    try {
      const res = await workspaceApi.updateWorkspace(workspaceId, data);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: "Failed to update workspace" });
    }
  }
);

/** Delete workspace */
export const deleteWorkspaceAsync = createAsyncThunk(
  "workspace/delete",
  async (workspaceId, { rejectWithValue }) => {
    try {
      await workspaceApi.deleteWorkspace(workspaceId);
      return workspaceId;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: "Failed to delete workspace" });
    }
  }
);

/** Clear workspace data */
export const clearWorkspaceDataAsync = createAsyncThunk(
  "workspace/clearData",
  async (workspaceId, { rejectWithValue }) => {
    try {
      await workspaceApi.clearWorkspaceData(workspaceId);
      return workspaceId;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: "Failed to clear workspace data" });
    }
  }
);

/* ─── Slice ───────────────────────────────────────────────────────────── */
const slice = createSlice({
  name: "workspace",
  initialState: {
    workspaces: [],
    currentWorkspaceId: null,
    loading: false,
    error: null,
  },
  reducers: {
    setCurrentWorkspace(state, { payload }) {
      state.currentWorkspaceId = payload;
    },
    /** Synchronous local create — kept for Onboarding / optimistic use */
    createWorkspace: {
      reducer(state, { payload }) {
        const mapped = { ...payload, id: payload.id || payload._id };
        state.workspaces.push(mapped);
        state.currentWorkspaceId = mapped.id;
      },
      prepare(input) {
        return { payload: { id: `local-${Date.now()}`, createdAt: Date.now(), ...input } };
      },
    },
    /** Keep for dev/testing */
    seedWorkspace(state, { payload }) {
      const id = payload.id || payload._id;
      if (!state.workspaces.find((w) => w.id === id || w._id === id)) {
        state.workspaces.push({ ...payload, id });
      }
      state.currentWorkspaceId = id;
    },
  },
  extraReducers: (builder) => {
    /* fetchWorkspaces */
    builder
      .addCase(fetchWorkspaces.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchWorkspaces.fulfilled, (state, { payload }) => {
        state.loading = false;
        const mapped = (payload.data || []).map((w) => {
          // If workspace is populated in project membership or workspace membership object:
          const wsObj = w.workspace || w;
          return {
            ...wsObj,
            id: wsObj.id || wsObj._id,
            membershipId: w.workspace ? w._id : undefined,
            role: w.workspace ? w.role : undefined
          };
        });
        state.workspaces = mapped;

        // Ensure currentWorkspaceId is valid, otherwise fallback to first workspace
        const exists = mapped.some((w) => w.id === state.currentWorkspaceId);
        if (!exists && mapped.length > 0) {
          state.currentWorkspaceId = mapped[0].id;
        }
      })
      .addCase(fetchWorkspaces.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload?.message || "Failed to load workspaces";
      });

    /* createWorkspace */
    builder
      .addCase(createWorkspaceAsync.pending, (state) => { state.loading = true; })
      .addCase(createWorkspaceAsync.fulfilled, (state, { payload }) => {
        state.loading = false;
        const ws = payload.data;
        if (ws) {
          const mapped = { ...ws, id: ws.id || ws._id };
          state.workspaces.push(mapped);
          state.currentWorkspaceId = mapped.id;
        }
      })
      .addCase(createWorkspaceAsync.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload?.message;
      });

    /* updateWorkspace */
    builder
      .addCase(updateWorkspaceAsync.fulfilled, (state, { payload }) => {
        const updated = payload.data;
        if (updated) {
          const idx = state.workspaces.findIndex((w) => w.id === updated._id || w._id === updated._id);
          if (idx !== -1) {
            state.workspaces[idx] = { ...updated, id: updated.id || updated._id };
          }
        }
      });

    /* deleteWorkspace */
    builder
      .addCase(deleteWorkspaceAsync.fulfilled, (state, { payload: deletedId }) => {
        state.workspaces = state.workspaces.filter((w) => w.id !== deletedId && w._id !== deletedId);
        if (state.currentWorkspaceId === deletedId) {
          state.currentWorkspaceId = state.workspaces[0]?.id || null;
        }
      });

    /* clearWorkspaceData */
    builder
      .addCase(clearWorkspaceDataAsync.pending, (state) => { state.loading = true; })
      .addCase(clearWorkspaceDataAsync.fulfilled, (state) => { state.loading = false; })
      .addCase(clearWorkspaceDataAsync.rejected, (state) => { state.loading = false; });
  },
});

export const { createWorkspace, setCurrentWorkspace, seedWorkspace } = slice.actions;
export default slice.reducer;

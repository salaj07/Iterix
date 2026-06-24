import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as workspaceApi from "@/services/workspace.api";
import * as invitationApi from "@/services/invitation.api";
import { uid } from "@/lib/uid";
import { ROLES } from "../seed";

/* ─── Async Thunks ────────────────────────────────────────────────────── */

/** Fetch all members of a workspace */
export const fetchMembers = createAsyncThunk(
  "org/fetchMembers",
  async (workspaceId, { rejectWithValue }) => {
    try {
      const res = await workspaceApi.getWorkspaceMembers(workspaceId);
      return res.data; // { success, data: [...members] }
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: "Failed to load members" });
    }
  }
);

/** Invite a member to a workspace */
export const inviteMemberAsync = createAsyncThunk(
  "org/inviteMember",
  async ({ workspaceId, email, role, projectId }, { rejectWithValue }) => {
    try {
      const res = await invitationApi.inviteMember(workspaceId, email, role, projectId);
      return res.data; // { success, data: invitation }
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: "Failed to send invitation" });
    }
  }
);

/** Fetch all invitations sent by a workspace */
export const fetchWorkspaceInvitations = createAsyncThunk(
  "org/fetchWorkspaceInvitations",
  async (workspaceId, { rejectWithValue }) => {
    try {
      const res = await invitationApi.getWorkspaceInvitations(workspaceId);
      return res.data; // { success, data: [...invitations] }
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: "Failed to load invitations" });
    }
  }
);

/** Accept workspace invitation */
export const acceptInvitationAsync = createAsyncThunk(
  "org/acceptInvitationAsync",
  async (invitationId, { rejectWithValue }) => {
    try {
      const res = await invitationApi.acceptInvitation(invitationId);
      return { invitationId, ...res.data }; // { success, message }
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: "Failed to accept invitation" });
    }
  }
);

/** Fetch all invitations sent to the current user */
export const fetchMyInvitations = createAsyncThunk(
  "org/fetchMyInvitations",
  async (_, { rejectWithValue }) => {
    try {
      const res = await invitationApi.getMyInvitations();
      return res.data; // { success, data: [...invitations] }
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: "Failed to load invitations" });
    }
  }
);

/** Cancel workspace invitation */
export const cancelInvitationAsync = createAsyncThunk(
  "org/cancelInvitation",
  async (invitationId, { rejectWithValue }) => {
    try {
      const res = await invitationApi.cancelInvitation(invitationId);
      return { invitationId, ...res.data }; // { success, message }
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: "Failed to cancel invitation" });
    }
  }
);

/** Update workspace member role */
export const updateMemberRoleAsync = createAsyncThunk(
  "org/updateMemberRole",
  async ({ workspaceId, memberId, role }, { rejectWithValue }) => {
    try {
      const res = await workspaceApi.updateWorkspaceMemberRole(workspaceId, memberId, role);
      return { memberId, role, ...res.data };
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: "Failed to update member role" });
    }
  }
);

/** Remove member from workspace */
export const removeMemberAsync = createAsyncThunk(
  "org/removeMember",
  async ({ workspaceId, memberId }, { rejectWithValue }) => {
    try {
      await workspaceApi.removeWorkspaceMember(workspaceId, memberId);
      return { memberId };
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: "Failed to remove member" });
    }
  }
);

/* ─── Slice ───────────────────────────────────────────────────────────── */
const slice = createSlice({
  name: "org",
  initialState: {
    orgs: [], // [{id, workspaceId, name, description, teamSize, ownerId, logo}]
    members: [], // [{id, orgId, name, email, role, avatarColor}]
    invitations: [], // [{id, orgId, name, email, role, status, sentAt}]
    myInvitations: [], // [{id, name, role, status, sentAt}] - invitations received by user
    loading: false,
    error: null,
  },
  reducers: {
    createOrg: {
      reducer(state, { payload }) { state.orgs.push(payload); },
      prepare(input) { return { payload: { id: uid(), createdAt: Date.now(), ...input } }; },
    },
    addMember: {
      reducer(state, { payload }) { state.members.push(payload); },
      prepare(input) { return { payload: { id: uid(), ...input } }; },
    },
    seedOrg(state, { payload }) {
      const { org, members } = payload;
      if (!state.orgs.find(o => o.id === org.id)) state.orgs.push(org);
      members.forEach(m => {
        if (!state.members.find(x => x.id === m.id)) state.members.push({ ...m, orgId: org.id });
      });
    },
    updateMemberRole(state, { payload }) {
      const m = state.members.find(x => x.id === payload.id);
      if (m) m.role = payload.role;
    },
    updateMemberName(state, { payload }) {
      const m = state.members.find(x => x.id === payload.id);
      if (m) m.name = payload.name;
    },
    removeMember(state, { payload }) {
      state.members = state.members.filter(m => m.id !== payload);
    },
    inviteMember: {
      reducer(state, { payload }) { state.invitations.push(payload); },
      prepare(input) {
        return { payload: { id: uid(), status: "pending", sentAt: Date.now(), ...input } };
      },
    },
    acceptInvitation(state, { payload }) {
      const inv = state.invitations.find(i => i.id === payload);
      if (inv) {
        inv.status = "accepted";
        state.members.push({
          id: uid(),
          orgId: inv.orgId,
          name: inv.name,
          email: inv.email,
          role: inv.role,
          avatarColor: ["#FF6044", "#A79277", "#6b5b47", "#8a7a63", "#d14a30"][Math.floor(Math.random()*5)],
        });
      }
    },
  },
  extraReducers: (builder) => {
    /* fetchMembers */
    builder
      .addCase(fetchMembers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMembers.fulfilled, (state, { payload }) => {
        state.loading = false;
        const colors = ["#FF6044", "#A79277", "#6b5b47", "#8a7a63", "#d14a30"];
        state.members = (payload.data || []).map((m, idx) => {
          let role = m.role;
          if (role === "MEMBER") role = "DEVELOPER";
          return {
            ...m,
            id: m.id || m._id,
            role,
            avatarColor: m.avatarColor || colors[idx % colors.length]
          };
        });
      })
      .addCase(fetchMembers.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload?.message || "Failed to load members";
      });

    /* inviteMemberAsync */
    builder
      .addCase(inviteMemberAsync.fulfilled, (state, { payload }) => {
        const inv = payload.data;
        if (inv) {
          state.invitations.push({
            ...inv,
            id: inv.id || inv._id,
            name: inv.email.split("@")[0],
            role: inv.role || "MEMBER",
            sentAt: inv.createdAt || Date.now(),
            status: (inv.status || "pending").toLowerCase()
          });
        }
      });

    /* fetchWorkspaceInvitations */
    builder
      .addCase(fetchWorkspaceInvitations.fulfilled, (state, { payload }) => {
        state.invitations = (payload.data || []).map(inv => ({
          ...inv,
          id: inv.id || inv._id,
          name: inv.email.split("@")[0],
          role: inv.role || "MEMBER",
          sentAt: inv.createdAt || Date.now(),
          status: (inv.status || "pending").toLowerCase()
        }));
      });

    /* fetchMyInvitations */
    builder
      .addCase(fetchMyInvitations.fulfilled, (state, { payload }) => {
        state.myInvitations = (payload.data || []).map(inv => ({
          ...inv,
          id: inv.id || inv._id,
          name: inv.workspace?.name || "Workspace",
          role: inv.role || "MEMBER",
          sentAt: inv.createdAt || Date.now(),
          status: (inv.status || "pending").toLowerCase()
        }));
      });

    /* acceptInvitationAsync */
    builder
      .addCase(acceptInvitationAsync.fulfilled, (state, { payload }) => {
        const inv = state.invitations.find(i => i.id === payload.invitationId);
        if (inv) {
          inv.status = "accepted";
        }
        const myInv = state.myInvitations.find(i => i.id === payload.invitationId);
        if (myInv) {
          myInv.status = "accepted";
        }
      });

    /* updateMemberRoleAsync */
    builder
      .addCase(updateMemberRoleAsync.fulfilled, (state, { payload }) => {
        const m = state.members.find(x => x.id === payload.memberId);
        if (m) {
          m.role = payload.role;
        }
      });

    /* removeMemberAsync */
    builder
      .addCase(removeMemberAsync.fulfilled, (state, { payload }) => {
        state.members = state.members.filter(m => m.id !== payload.memberId);
      });

    /* cancelInvitationAsync */
    builder
      .addCase(cancelInvitationAsync.fulfilled, (state, { payload }) => {
        state.invitations = state.invitations.filter(i => i.id !== payload.invitationId);
      });
  },
});

export const { createOrg, addMember, seedOrg, updateMemberRole, updateMemberName, removeMember, inviteMember, acceptInvitation } = slice.actions;
export { ROLES };
export default slice.reducer;

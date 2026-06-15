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
  async ({ workspaceId, email, role }, { rejectWithValue }) => {
    try {
      const res = await invitationApi.inviteMember(workspaceId, email, role);
      return res.data; // { success, data: invitation }
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: "Failed to send invitation" });
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
        state.members = (payload.data || []).map((m, idx) => ({
          ...m,
          id: m.id || m._id,
          avatarColor: m.avatarColor || colors[idx % colors.length]
        }));
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
            status: inv.status || "pending"
          });
        }
      });
  },
});

export const { createOrg, addMember, seedOrg, updateMemberRole, removeMember, inviteMember, acceptInvitation } = slice.actions;
export { ROLES };
export default slice.reducer;

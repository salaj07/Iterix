import { createSlice } from "@reduxjs/toolkit";
import { uid } from "@/lib/uid";
import { ROLES } from "../seed";

const slice = createSlice({
  name: "org",
  initialState: {
    orgs: [], // [{id, workspaceId, name, description, teamSize, ownerId, logo}]
    members: [], // [{id, orgId, name, email, role, avatarColor}]
    invitations: [], // [{id, orgId, name, email, role, status, sentAt}]
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
});

export const { createOrg, addMember, seedOrg, updateMemberRole, removeMember, inviteMember, acceptInvitation } = slice.actions;
export { ROLES };
export default slice.reducer;

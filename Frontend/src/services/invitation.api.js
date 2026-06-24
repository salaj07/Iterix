import api from "@/lib/api";

/**
 * Invitation API — maps to backend /api/invitations/* and /api/workspaces/:id/invite
 */

/** Invite a user to a workspace by email */
export const inviteMember = (workspaceId, email, role = "member", projectId = null) =>
  api.post(`/api/workspaces/${workspaceId}/invite`, { email, role, projectId });

/** Get all pending invitations for the logged-in user */
export const getMyInvitations = () =>
  api.get("/api/invitations");

/** Accept an invitation */
export const acceptInvitation = (invitationId) =>
  api.post(`/api/invitations/${invitationId}/accept`);

/** Reject an invitation */
export const rejectInvitation = (invitationId) =>
  api.post(`/api/invitations/${invitationId}/reject`);

/** Get all invitations sent by a specific workspace */
export const getWorkspaceInvitations = (workspaceId) =>
  api.get(`/api/workspaces/${workspaceId}/invitations`);

/** Cancel an invitation */
export const cancelInvitation = (invitationId) =>
  api.delete(`/api/invitations/${invitationId}/cancel`);

import api from "@/lib/api";

/** Submit a join request for a workspace */
export const createJoinRequest = (workspaceId) =>
  api.post("/api/join-requests", { workspaceId });

/** Get pending join requests for a workspace (admin only) */
export const getWorkspaceJoinRequests = (workspaceId) =>
  api.get(`/api/workspaces/${workspaceId}/join-requests`);

/** Resolve a join request (admin only) */
export const resolveJoinRequest = (requestId, action) =>
  api.post(`/api/join-requests/${requestId}/resolve`, { action });

/** Get the current user's pending join requests */
export const getMyJoinRequests = () =>
  api.get("/api/join-requests/my");

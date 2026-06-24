import api from "@/lib/api";

/**
 * Workspace API — maps to backend /api/workspaces/*
 */

/** Create a new workspace */
export const createWorkspace = (data) =>
  api.post("/api/workspaces", data);

/** Get all workspaces for the logged-in user */
export const getUserWorkspaces = () =>
  api.get("/api/workspaces");

/** Get a single workspace by ID */
export const getWorkspaceById = (workspaceId) =>
  api.get(`/api/workspaces/${workspaceId}`);

/** Update workspace name or description */
export const updateWorkspace = (workspaceId, data) =>
  api.patch(`/api/workspaces/${workspaceId}`, data);

/** Delete a workspace */
export const deleteWorkspace = (workspaceId) =>
  api.delete(`/api/workspaces/${workspaceId}`);

/** Get all members of a workspace */
export const getWorkspaceMembers = (workspaceId) =>
  api.get(`/api/workspaces/${workspaceId}/members`);

/** Update a workspace member's role */
export const updateWorkspaceMemberRole = (workspaceId, memberId, role) =>
  api.patch(`/api/workspaces/${workspaceId}/members/${memberId}`, { role });

/** Remove a member from a workspace */
export const removeWorkspaceMember = (workspaceId, memberId) =>
  api.delete(`/api/workspaces/${workspaceId}/members/${memberId}`);

/** Clear all data inside a workspace */
export const clearWorkspaceData = (workspaceId) =>
  api.post(`/api/workspaces/${workspaceId}/clear`);

/** List all active workspaces in system */
export const listAllWorkspaces = () =>
  api.get("/api/workspaces/all/list");


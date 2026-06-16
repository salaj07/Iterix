import api from "@/lib/api";

/**
 * Project API — maps to backend /api/projects/*
 */

/** Create a new project in a workspace */
export const createProject = (data) =>
  api.post("/api/projects", data);

/** Get all projects the user belongs to */
export const getUserProjects = () =>
  api.get("/api/projects");

/** Get a single project by ID */
export const getProjectById = (projectId) =>
  api.get(`/api/projects/${projectId}`);

/** Get project dashboard (task counts, sprint info, etc.) */
export const getProjectDashboard = (projectId) =>
  api.get(`/api/projects/${projectId}/dashboard`);

/** Get all members of a project */
export const getProjectMembers = (projectId) =>
  api.get(`/api/projects/${projectId}/members`);

/** Add a member to a project */
export const addProjectMember = (projectId, userId, role) =>
  api.post(`/api/projects/${projectId}/members`, { userId, role });

/** Remove a member from a project */
export const removeProjectMember = (projectId, userId) =>
  api.delete(`/api/projects/${projectId}/members/${userId}`);

/** Update a member's role in a project */
export const updateProjectMemberRole = (projectId, userId, role) =>
  api.patch(`/api/projects/${projectId}/members/${userId}`, { role });

/** Archive a project */
export const archiveProject = (projectId) =>
  api.patch(`/api/projects/${projectId}/archive`);

/** Update project details */
export const updateProject = (projectId, data) =>
  api.patch(`/api/projects/${projectId}`, data);

/** Delete a project */
export const deleteProject = (projectId) =>
  api.delete(`/api/projects/${projectId}`);

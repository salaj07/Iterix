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

/** Archive a project */
export const archiveProject = (projectId) =>
  api.patch(`/api/projects/${projectId}/archive`);

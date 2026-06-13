import api from "@/lib/api";

/**
 * Sprint API — maps to backend /api/sprints/*
 */

/** Create a new sprint */
export const createSprint = (data) =>
  api.post("/api/sprints", data);

/** Get all sprints for a project */
export const getProjectSprints = (projectId) =>
  api.get(`/api/sprints/project/${projectId}`);

/** Start a sprint (changes status to "active") */
export const startSprint = (sprintId) =>
  api.patch(`/api/sprints/${sprintId}/start`);

/** Complete a sprint (changes status to "completed") */
export const completeSprint = (sprintId) =>
  api.patch(`/api/sprints/${sprintId}/complete`);

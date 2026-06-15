import api from "@/lib/api";

/**
 * Task API — maps to backend /api/tasks/*
 */

/** Create a new task */
export const createTask = (data) =>
  api.post("/api/tasks", data);

/** Get all tasks for a project */
export const getProjectTasks = (projectId) =>
  api.get(`/api/tasks/project/${projectId}`);

/** Change task status (Backlog, Todo, In Progress, In Review, Done) */
export const changeTaskStatus = (taskId, status) =>
  api.patch(`/api/tasks/${taskId}/status`, { status });

/** Assign a task to a user */
export const assignTask = (taskId, assigneeId) =>
  api.patch(`/api/tasks/${taskId}/assign`, { assigneeId });

/** Move a task to a sprint */
export const moveToSprint = (taskId, sprintId) =>
  api.patch(`/api/tasks/${taskId}/move-to-sprint`, { sprintId });

/** Approve a task (moves it to Done) */
export const approveTask = (taskId) =>
  api.patch(`/api/tasks/${taskId}/approve`);

/** Request changes on a task (moves it back to In Progress) */
export const requestChanges = (taskId, note) =>
  api.patch(`/api/tasks/${taskId}/request-changes`, { note });

/** Update task details */
export const updateTaskDetails = (taskId, data) =>
  api.patch(`/api/tasks/${taskId}`, data);

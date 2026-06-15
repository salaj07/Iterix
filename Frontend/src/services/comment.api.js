import api from "@/lib/api";

/**
 * Comment API — maps to backend /api/comments/*
 */

/** Add a comment to a task */
export const addComment = (taskId, content) =>
  api.post("/api/comments", { taskId, content });

/** Get all comments for a task */
export const getTaskComments = (taskId) =>
  api.get(`/api/comments/task/${taskId}`);

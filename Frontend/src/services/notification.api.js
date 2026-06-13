import api from "@/lib/api";

/**
 * Notification API — maps to backend /api/notifications/*
 */

/** Get all notifications for the logged-in user */
export const getNotifications = () =>
  api.get("/api/notifications");

/** Mark a single notification as read */
export const markAsRead = (notificationId) =>
  api.patch(`/api/notifications/${notificationId}/read`);

/** Mark all notifications as read */
export const markAllAsRead = () =>
  api.patch("/api/notifications/read-all");

/** Delete a notification */
export const deleteNotification = (notificationId) =>
  api.delete(`/api/notifications/${notificationId}`);

const Notification = require("../models/notification.model");

/**
 * Create Notification
 */
const createNotification = async ({
  user,
  title,
  message,
  type,
  projectId,
  taskId,
  workspaceId,
}) => {
  const notif = await Notification.create({
    user,
    title,
    message,
    type,
    projectId,
    taskId,
    workspaceId,
  });

  // Emit real-time notification
  try {
    const { getIO } = require("../socket");
    const io = getIO();
    if (io) {
      io.to(`user:${user.toString()}`).emit("new_notification", {
        ...notif.toObject(),
        id: notif._id,
        read: notif.isRead,
      });
    }
  } catch (err) {
    console.error("Failed to emit socket notification:", err);
  }

  // Send email alerts for critical events
  if (type === "TASK_ASSIGNED" || type === "SPRINT" || type === "TASK_APPROVED" || type === "TASK_REJECTED" || type === "COMMENT") {
    try {
      const User = require("../models/user.model");
      const { sendNotificationEmail } = require("./email.service");
      const targetUser = await User.findById(user);
      if (targetUser && targetUser.email) {
        await sendNotificationEmail(targetUser.email, title, message);
      }
    } catch (err) {
      console.error("Failed to send notification email", err);
    }
  }

  return notif;
};

/**
 * Get User Notifications
 */
const getNotifications = async (currentUser) => {
  return await Notification.find({
    user: currentUser._id,
  }).sort({ createdAt: -1 });
};

/**
 * Mark One Notification as Read
 */
const markAsRead = async (notificationId, currentUser) => {
  const notification = await Notification.findOne({
    _id: notificationId,
    user: currentUser._id,
  });

  if (!notification) {
    throw new Error("Notification not found");
  }

  notification.isRead = true;
  await notification.save();

  return notification;
};

/**
 * Mark All Notifications as Read
 */
const markAllAsRead = async (currentUser) => {
  await Notification.updateMany(
    {
      user: currentUser._id,
      isRead: false,
    },
    {
      isRead: true,
    }
  );

  return {
    message: "All notifications marked as read",
  };
};

/**
 * Delete Notification
 */
const deleteNotification = async (
  notificationId,
  currentUser
) => {
  const notification = await Notification.findOneAndDelete({
    _id: notificationId,
    user: currentUser._id,
  });

  if (!notification) {
    throw new Error("Notification not found");
  }

  return {
    message: "Notification deleted successfully",
  };
};

module.exports = {
  createNotification,
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
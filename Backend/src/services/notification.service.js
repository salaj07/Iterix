const Notification = require("../models/notification.model");

/**
 * Create Notification
 */
const createNotification = async ({
  user,
  title,
  message,
  type,
}) => {
  return await Notification.create({
    user,
    title,
    message,
    type,
  });
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
const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/auth.middleware");
const notificationController = require("../controller/notification.controller");

router.get(
  "/",
  protect,
  notificationController.getNotifications
);

router.patch(
  "/:id/read",
  protect,
  notificationController.markAsRead
);

router.patch(
  "/read-all",
  protect,
  notificationController.markAllAsRead
);

router.delete(
  "/:id",
  protect,
  notificationController.deleteNotification
);

module.exports = router;
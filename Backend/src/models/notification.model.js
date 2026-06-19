const mongoose = require("mongoose");
const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: String,
    message: String,
    type: {
      type: String,
      enum: [
        "TASK_ASSIGNED",
        "TASK_APPROVED",
        "TASK_REJECTED",
        "COMMENT",
        "INVITATION",
        "SPRINT",
        "MEMBER_JOINED",
        "PROJECT_ASSIGNED",
      ],
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Notification", notificationSchema);
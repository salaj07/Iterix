const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },

    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      default: null,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    action: {
      type: String,
      required: true,
      enum: [
        "TASK_CREATED",
        "TASK_ASSIGNED",
        "TASK_MOVED_TO_SPRINT",
        "TASK_STATUS_CHANGED",
        "TASK_APPROVED",
        "TASK_CHANGES_REQUESTED",
        "COMMENT_ADDED",
      ],
    },

    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

activitySchema.index({ project: 1, createdAt: -1 });

module.exports = mongoose.model("Activity", activitySchema);
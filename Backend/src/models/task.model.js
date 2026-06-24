const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    // Human-readable ID (e.g., WEB-1, CRM-25)
    taskCode: {
      type: String,
      unique: true,
      uppercase: true,
      trim: true,
    },

    // Project to which the task belongs
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },

    // Null = Backlog, Assigned = Sprint
    sprint: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Sprint",
      default: null,
    },

    // BACKLOG or SPRINT
    workflowStage: {
      type: String,
      enum: ["BACKLOG", "SPRINT"],
      default: "BACKLOG",
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    type: {
      type: String,
      enum: ["Story", "Task", "Bug", "Epic"],
      default: "Task",
    },

    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      default: "MEDIUM",
    },

    status: {
      type: String,
      enum: ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"],
      default: "TODO",
    },

    storyPoints: {
      type: Number,
      default: 1,
      min: 1,
    },

    assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    dueDate: {
      type: Date,
      default: null,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    subtasks: [
      {
        title: {
          type: String,
          required: true,
          trim: true,
        },
        done: {
          type: Boolean,
          default: false,
        },
      },
    ],

    history: [
      {
        at: {
          type: Date,
          default: Date.now,
        },
        by: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        type: {
          type: String,
          required: true,
          enum: [
            "created",
            "status_change",
            "submitted_for_review",
            "approved",
            "rejected",
            "archived",
            "unarchived",
          ],
        },
        from: String,
        to: String,
        note: String,
      },
    ],

    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Useful indexes
taskSchema.index({ project: 1 });
taskSchema.index({ sprint: 1 });
taskSchema.index({ assignee: 1 });
taskSchema.index({ status: 1 });
taskSchema.index({ workflowStage: 1 });

module.exports = mongoose.model("Task", taskSchema);
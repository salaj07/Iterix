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
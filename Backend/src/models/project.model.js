const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },
    projectKey: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },

    taskCounter: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      enum: ["ACTIVE", "ARCHIVED"],
      default: "ACTIVE",
    },

    startDate: {
      type: Date,
      default: null,
    },

    endDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Prevent duplicate project names within the same workspace
projectSchema.index(
  {
    workspace: 1,
    name: 1,
  },
  {
    unique: true,
  },
);

module.exports = mongoose.model("Project", projectSchema);

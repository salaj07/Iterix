const mongoose = require("mongoose");

const sprintSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    goal: {
      type: String,
      default: "",
      trim: true,
    },

    status: {
      type: String,
      enum: ["PLANNED", "ACTIVE", "COMPLETED"],
      default: "PLANNED",
    },

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate sprint names within a project
sprintSchema.index(
  {
    project: 1,
    name: 1,
  },
  {
    unique: true,
  }
);

module.exports = mongoose.model("Sprint", sprintSchema);
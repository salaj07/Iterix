const mongoose = require("mongoose");

const workspaceMemberSchema = new mongoose.Schema(
  {
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    role: {
      type: String,
      enum: ["ADMIN", "MEMBER"],
      default: "MEMBER",
      required: true,
    },

    joinedAt: {
      type: Date,
      default: Date.now,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate membership
workspaceMemberSchema.index(
  { workspace: 1, user: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  "WorkspaceMember",
  workspaceMemberSchema
);
const mongoose = require("mongoose");

const joinRequestSchema = new mongoose.Schema(
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
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "ACCEPTED", "REJECTED"],
      default: "PENDING",
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate pending join requests for the same email and workspace
joinRequestSchema.index(
  { workspace: 1, email: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "PENDING" },
  }
);

module.exports = mongoose.model("JoinRequest", joinRequestSchema);

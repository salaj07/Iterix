const mongoose = require("mongoose");

const invitationSchema = new mongoose.Schema(
  {
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    role: {
      type: String,
      enum: ["MEMBER"],
      default: "MEMBER",
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

// Prevent duplicate pending invitations
invitationSchema.index(
  {
    workspace: 1,
    email: 1,
    status: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      status: "PENDING",
    },
  }
);

module.exports = mongoose.model("Invitation", invitationSchema);
const JoinRequest = require("../models/joinRequest.model");
const Workspace = require("../models/Workspace.model");
const WorkspaceMember = require("../models/workspaceMember.model");
const { createNotification } = require("./notification.service");

/**
 * Submit a join request for a workspace
 */
const createJoinRequest = async (user, workspaceId) => {
  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) {
    throw new Error("Workspace not found");
  }

  // Check if user is already a member
  const existingMember = await WorkspaceMember.findOne({
    workspace: workspaceId,
    user: user._id,
    isActive: true,
  });

  if (existingMember) {
    throw new Error("You are already a member of this workspace");
  }

  // Check if a pending request already exists for this email and workspace
  const pending = await JoinRequest.findOne({
    workspace: workspaceId,
    email: user.email,
    status: "PENDING",
  });

  if (pending) {
    throw new Error("A pending request already exists for this workspace. Please wait for an admin to review it.");
  }

  // Delete any rejected requests to clear history and avoid uniqueness conflicts
  await JoinRequest.deleteMany({
    workspace: workspaceId,
    email: user.email,
    status: { $in: ["REJECTED", "ACCEPTED"] },
  });

  // Create join request
  const joinRequest = await JoinRequest.create({
    workspace: workspaceId,
    user: user._id,
    email: user.email,
    status: "PENDING",
  });

  // Notify workspace admins
  try {
    const admins = await WorkspaceMember.find({
      workspace: workspaceId,
      role: "ADMIN",
      isActive: true,
    });

    for (const admin of admins) {
      if (admin.user && admin.user.toString() !== user._id.toString()) {
        await createNotification({
          user: admin.user,
          title: "Join Request Received",
          message: `${user.name} (${user.email}) requested to join "${workspace.name}".`,
          type: "INVITATION", // use existing notification types
        });
      }
    }
  } catch (err) {
    console.error("Failed to notify admins for join request:", err);
  }

  return joinRequest;
};

/**
 * Get pending join requests for a workspace (admin-only)
 */
const getWorkspaceJoinRequests = async (workspaceId, adminUser) => {
  const adminMembership = await WorkspaceMember.findOne({
    workspace: workspaceId,
    user: adminUser._id,
    role: "ADMIN",
    isActive: true,
  });

  if (!adminMembership) {
    throw new Error("Only workspace admins can view join requests");
  }

  return await JoinRequest.find({
    workspace: workspaceId,
    status: "PENDING",
  }).populate("user", "name email").sort({ createdAt: -1 });
};

/**
 * Accept or reject a join request (admin-only)
 */
const resolveJoinRequest = async (requestId, adminUser, action) => {
  const joinRequest = await JoinRequest.findById(requestId);
  if (!joinRequest) {
    throw new Error("Join request not found");
  }

  if (joinRequest.status !== "PENDING") {
    throw new Error("Join request has already been resolved");
  }

  // Verify adminUser is ADMIN of the target workspace
  const adminMembership = await WorkspaceMember.findOne({
    workspace: joinRequest.workspace,
    user: adminUser._id,
    role: "ADMIN",
    isActive: true,
  });

  if (!adminMembership) {
    throw new Error("Only workspace admins can resolve join requests");
  }

  const workspace = await Workspace.findById(joinRequest.workspace);
  const workspaceName = workspace ? workspace.name : "workspace";

  if (action === "ACCEPT") {
    joinRequest.status = "ACCEPTED";
    await joinRequest.save();

    // Check if membership already exists (e.g. was soft deleted)
    const existingMember = await WorkspaceMember.findOne({
      workspace: joinRequest.workspace,
      user: joinRequest.user,
    });

    if (existingMember) {
      existingMember.isActive = true;
      existingMember.role = "DEVELOPER";
      await existingMember.save();
    } else {
      await WorkspaceMember.create({
        workspace: joinRequest.workspace,
        user: joinRequest.user,
        role: "DEVELOPER",
      });
    }

    // Notify requester
    try {
      await createNotification({
        user: joinRequest.user,
        title: "Join Request Approved",
        message: `Your request to join workspace "${workspaceName}" has been approved.`,
        type: "INVITATION",
      });
    } catch (err) {
      console.error("Failed to notify user on request approval:", err);
    }

    return { message: "Join request accepted successfully" };
  } else if (action === "REJECT") {
    joinRequest.status = "REJECTED";
    await joinRequest.save();

    // Notify requester
    try {
      await createNotification({
        user: joinRequest.user,
        title: "Join Request Declined",
        message: `Your request to join workspace "${workspaceName}" was declined.`,
        type: "INVITATION",
      });
    } catch (err) {
      console.error("Failed to notify user on request decline:", err);
    }

    return { message: "Join request rejected successfully" };
  } else {
    throw new Error("Invalid action. Must be ACCEPT or REJECT");
  }
};

const getMyJoinRequests = async (user) => {
  return await JoinRequest.find({
    user: user._id,
    status: "PENDING",
  }).populate("workspace", "name description");
};

module.exports = {
  createJoinRequest,
  getWorkspaceJoinRequests,
  resolveJoinRequest,
  getMyJoinRequests,
};

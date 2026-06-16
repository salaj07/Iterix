const Invitation = require("../models/invitation.model");
const Workspace = require("../models/Workspace.model");
const WorkspaceMember = require("../models/workspaceMember.model");
const User = require("../models/user.model");
const { sendInvitationEmail } = require("./email.service");

/**
 * Invite a user to a workspace
 */
const inviteMember = async (workspaceId, adminUser, email, role = "DEVELOPER") => {
  // Check workspace exists
  const workspace = await Workspace.findById(workspaceId);

  if (!workspace) {
    throw new Error("Workspace not found");
  }

  // Check admin permission
  const adminMembership = await WorkspaceMember.findOne({
    workspace: workspaceId,
    user: adminUser._id,
    role: "ADMIN",
    isActive: true,
  });

  if (!adminMembership) {
    throw new Error("Only workspace admins can invite members");
  }

  // Check if user already exists and is already a member
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    const existingMember = await WorkspaceMember.findOne({
      workspace: workspaceId,
      user: existingUser._id,
      isActive: true,
    });

    if (existingMember) {
      throw new Error("User is already a member of this workspace");
    }
  }

  // Check pending invitation
  const pendingInvite = await Invitation.findOne({
    workspace: workspaceId,
    email,
    status: "PENDING",
  });

  if (pendingInvite) {
    throw new Error("Invitation already sent");
  }

  // Delete any existing accepted or rejected invitations for this user to clear history and prevent unique constraint conflicts
  await Invitation.deleteMany({
    workspace: workspaceId,
    email,
  });

  // Create invitation
  const invitation = await Invitation.create({
    workspace: workspaceId,
    email,
    invitedBy: adminUser._id,
    role,
  });

  // Send email
  await sendInvitationEmail(email, workspace.name);

  return invitation;
};

/**
 * Get pending invitations for logged-in user
 */
const getMyInvitations = async (user) => {
  return await Invitation.find({
    email: user.email,
    status: "PENDING",
  }).populate("workspace", "name description");
};

/**
 * Accept invitation
 */
const acceptInvitation = async (invitationId, user) => {
  const invitation = await Invitation.findById(invitationId);

  if (!invitation) {
    throw new Error("Invitation not found");
  }

  if (invitation.status !== "PENDING") {
    throw new Error("Invitation is no longer valid");
  }

  if (invitation.email !== user.email) {
    throw new Error("This invitation does not belong to your account");
  }

  // Reactivate existing soft-deleted member if they previously belonged to the workspace, to prevent unique index duplicate errors
  const existingMember = await WorkspaceMember.findOne({
    workspace: invitation.workspace,
    user: user._id,
  });

  if (existingMember) {
    existingMember.isActive = true;
    existingMember.role = invitation.role || "DEVELOPER";
    await existingMember.save();
  } else {
    await WorkspaceMember.create({
      workspace: invitation.workspace,
      user: user._id,
      role: invitation.role || "DEVELOPER",
    });
  }

  invitation.status = "ACCEPTED";
  await invitation.save();

  try {
    const ws = await Workspace.findById(invitation.workspace);
    const wsName = ws ? ws.name : "workspace";

    const admins = await WorkspaceMember.find({
      workspace: invitation.workspace,
      role: "ADMIN",
      isActive: true,
    });

    const recipientIds = new Set();
    if (invitation.invitedBy) {
      recipientIds.add(invitation.invitedBy.toString());
    }
    admins.forEach((adm) => {
      if (adm.user) recipientIds.add(adm.user.toString());
    });

    recipientIds.delete(user._id.toString());

    const { createNotification } = require("./notification.service");
    for (const recipientId of recipientIds) {
      await createNotification({
        user: recipientId,
        title: "Member joined workspace",
        message: `${user.name} has joined the workspace "${wsName}".`,
        type: "MEMBER_JOINED",
      });
    }
  } catch (err) {
    console.error("Failed to send join workspace notification:", err);
  }

  return {
    message: "Invitation accepted successfully",
  };
};

/**
 * Reject invitation
 */
const rejectInvitation = async (invitationId, user) => {
  const invitation = await Invitation.findById(invitationId);

  if (!invitation) {
    throw new Error("Invitation not found");
  }

  if (invitation.email !== user.email) {
    throw new Error("Unauthorized");
  }

  invitation.status = "REJECTED";
  await invitation.save();

  return {
    message: "Invitation rejected successfully",
  };
};

/**
 * Get invitations sent by a specific workspace (admin-only)
 */
const getWorkspaceInvitations = async (workspaceId, adminUser) => {
  const adminMembership = await WorkspaceMember.findOne({
    workspace: workspaceId,
    user: adminUser._id,
    role: "ADMIN",
    isActive: true,
  });

  if (!adminMembership) {
    throw new Error("Only workspace admins can view invitations");
  }

  return await Invitation.find({ workspace: workspaceId })
    .populate("invitedBy", "name email")
    .sort({ createdAt: -1 });
};

module.exports = {
  inviteMember,
  getMyInvitations,
  acceptInvitation,
  rejectInvitation,
  getWorkspaceInvitations,
};
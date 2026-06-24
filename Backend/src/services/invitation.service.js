const Invitation = require("../models/invitation.model");
const Workspace = require("../models/Workspace.model");
const WorkspaceMember = require("../models/workspaceMember.model");
const User = require("../models/user.model");
const { sendInvitationEmail } = require("./email.service");

/**
 * Invite a user to a workspace
 */
const inviteMember = async (workspaceId, adminUser, email, role = "DEVELOPER", projectId = null) => {
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
    project: projectId || null,
  });

  // Send email
  await sendInvitationEmail(email, workspace.name);

  // Send in-app notification if the user is already registered in the system
  if (existingUser) {
    try {
      const { createNotification } = require("./notification.service");
      await createNotification({
        user: existingUser._id,
        title: "Workspace Invitation",
        message: `You have been invited to join the workspace "${workspace.name}" by ${adminUser.name}.`,
        type: "INVITATION",
        workspaceId: workspace._id,
      });
    } catch (err) {
      console.error("Failed to create in-app invitation notification:", err);
    }
  }

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

  // Auto-assign to project if invited to a project
  if (invitation.project) {
    const ProjectMember = require("../models/projectMember.model");
    
    const projectRole = (invitation.role === "ADMIN" || invitation.role === "TEAM_LEAD") ? "TEAM_LEAD" : "DEVELOPER";
    
    // Check if they are already in the project (even soft-deleted)
    const existingProjMember = await ProjectMember.findOne({
      project: invitation.project,
      user: user._id,
    });
    let isNewProjAssignment = false;
    if (existingProjMember) {
      if (!existingProjMember.isActive) {
        isNewProjAssignment = true;
      }
      existingProjMember.isActive = true;
      existingProjMember.role = projectRole;
      await existingProjMember.save();
    } else {
      isNewProjAssignment = true;
      await ProjectMember.create({
        project: invitation.project,
        user: user._id,
        role: projectRole,
      });
    }

    if (isNewProjAssignment) {
      try {
        const { createNotification } = require("./notification.service");
        const Project = require("../models/project.model");
        const proj = await Project.findById(invitation.project);
        if (proj) {
          await createNotification({
            user: user._id,
            title: "Project Assigned",
            message: `You have been assigned to the project "${proj.name}".`,
            type: "PROJECT_ASSIGNED",
            projectId: invitation.project,
          });
        }
      } catch (err) {
        console.error("Failed to create project assignment notification in invite accept:", err);
      }
    }
  }

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
        workspaceId: invitation.workspace,
      });
    }
  } catch (err) {
    console.error("Failed to send join workspace notification:", err);
  }

  try {
    const { emitWorkspaceEvent, emitProjectEvent } = require("../socket");
    emitWorkspaceEvent(invitation.workspace, "workspace_member_joined", {
      workspaceId: invitation.workspace,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email
      },
      role: invitation.role || "DEVELOPER"
    });

    if (invitation.project) {
      const projectRole = (invitation.role === "ADMIN" || invitation.role === "TEAM_LEAD") ? "TEAM_LEAD" : "DEVELOPER";
      emitProjectEvent(invitation.project, "project_member_added", {
        projectId: invitation.project,
        userId: user._id,
        role: projectRole
      });
    }
  } catch (err) {
    console.error("Failed to emit workspace_member_joined socket event:", err.message);
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

const cancelInvitation = async (invitationId, currentUser) => {
  const invitation = await Invitation.findById(invitationId);
  if (!invitation) {
    throw new Error("Invitation not found");
  }

  if (invitation.status !== "PENDING") {
    throw new Error("Only pending invitations can be cancelled");
  }

  // Check if currentUser is ADMIN of the workspace
  const adminMembership = await WorkspaceMember.findOne({
    workspace: invitation.workspace,
    user: currentUser._id,
    role: "ADMIN",
    isActive: true,
  });

  if (!adminMembership) {
    throw new Error("Only workspace admins can cancel invitations");
  }

  // Remove the invitation
  await Invitation.findByIdAndDelete(invitationId);

  return {
    message: "Invitation cancelled successfully",
  };
};

module.exports = {
  inviteMember,
  getMyInvitations,
  acceptInvitation,
  rejectInvitation,
  getWorkspaceInvitations,
  cancelInvitation,
};
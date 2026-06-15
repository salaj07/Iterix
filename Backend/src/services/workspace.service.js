const Workspace = require("../models/Workspace.model");
const WorkspaceMember = require("../models/workspaceMember.model");

const createWorkspace = async (user, data) => {
  const { name, description } = data;

  if (!name) {
    throw new Error("Workspace name is required");
  }

  // Create workspace
  const workspace = await Workspace.create({
    name,
    description,
    owner: user._id,
  });

  // Add creator as ADMIN

  await WorkspaceMember.create({
    workspace: workspace._id,
    user: user._id,
    role: "ADMIN",
  });

  return workspace;
};

const getUserWorkspaces = async (user) => {
  const memberships = await WorkspaceMember.find({
    user: user._id,
    isActive: true,
  }).populate("workspace");

  return memberships;
};

const getWorkspaceById = async (user, workspaceId) => {
  const membership = await WorkspaceMember.findOne({
    workspace: workspaceId,
    user: user._id,
    isActive: true,
  }).populate("workspace");

  if (!membership) {
    throw new Error("Workspace not found or access denied");
  }

  return membership.workspace;
};

const updateWorkspace = async (user, workspaceId, data) => {
  const membership = await WorkspaceMember.findOne({
    workspace: workspaceId,
    user: user._id,
    role: "ADMIN",
    isActive: true,
  });

  if (!membership) {
    throw new Error("Only workspace admins can update the workspace");
  }

  const workspace = await Workspace.findByIdAndUpdate(
    workspaceId,
    data,
    { new: true }
  );

  return workspace;
};

const deleteWorkspace = async (user, workspaceId) => {
  const membership = await WorkspaceMember.findOne({
    workspace: workspaceId,
    user: user._id,
    role: "ADMIN",
    isActive: true,
  });

  if (!membership) {
    throw new Error("Only workspace admins can delete the workspace");
  }

  await Workspace.findByIdAndDelete(workspaceId);
  await WorkspaceMember.deleteMany({ workspace: workspaceId });
};


/**
 * Get all members of a workspace
 */
const getWorkspaceMembers = async (workspaceId, currentUser) => {
  // Check if current user belongs to this workspace
  const membership = await WorkspaceMember.findOne({
    workspace: workspaceId,
    user: currentUser._id,
    isActive: true,
  });

  if (!membership) {
    throw new Error("Access denied");
  }

  // Get all active members
  const members = await WorkspaceMember.find({
    workspace: workspaceId,
    isActive: true,
  })
    .populate("user", "name email")
    .sort({ createdAt: 1 });

  return members.map((member) => ({
    id: member.user._id,
    name: member.user.name,
    email: member.user.email,
    role: member.role,
    joinedAt: member.createdAt,
  }));
};

module.exports = {
  createWorkspace,
  getUserWorkspaces,
  getWorkspaceById,
  updateWorkspace,
  deleteWorkspace,
  getWorkspaceMembers,
};
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

const updateMemberRole = async (workspaceId, adminUser, memberId, newRole) => {
  // Check if adminUser is indeed an ADMIN of the workspace
  const adminMembership = await WorkspaceMember.findOne({
    workspace: workspaceId,
    user: adminUser._id,
    role: "ADMIN",
    isActive: true,
  });

  if (!adminMembership) {
    throw new Error("Only workspace admins can update member roles");
  }

  // If the new workspace role is DEVELOPER or MEMBER, demote them to DEVELOPER in all projects where they are currently TEAM_LEAD
  if (newRole === "DEVELOPER" || newRole === "MEMBER") {
    const Project = require("../models/project.model");
    const ProjectMember = require("../models/projectMember.model");
    const projects = await Project.find({ workspace: workspaceId });
    const projectIds = projects.map(p => p._id);

    for (const pid of projectIds) {
      const pm = await ProjectMember.findOne({ project: pid, user: memberId, role: "TEAM_LEAD", isActive: true });
      if (pm) {
        // Ensure there is at least one other active TEAM_LEAD in the project
        const activeLeadsCount = await ProjectMember.countDocuments({
          project: pid,
          role: "TEAM_LEAD",
          isActive: true,
        });

        if (activeLeadsCount > 1) {
          pm.role = "DEVELOPER";
          await pm.save();
        } else {
          const proj = await Project.findById(pid);
          const projName = proj ? proj.name : "the project";
          throw new Error(`Cannot demote this user because they are the sole Project Lead of project "${projName}". Please assign another Project Lead to that project first.`);
        }
      }
    }
  }

  // Update role
  const membership = await WorkspaceMember.findOneAndUpdate(
    { workspace: workspaceId, user: memberId, isActive: true },
    { role: newRole },
    { new: true }
  );

  if (!membership) {
    throw new Error("Workspace member not found");
  }

  return membership;
};

const removeMember = async (workspaceId, adminUser, memberId) => {
  // Check if adminUser is indeed an ADMIN of the workspace
  const adminMembership = await WorkspaceMember.findOne({
    workspace: workspaceId,
    user: adminUser._id,
    role: "ADMIN",
    isActive: true,
  });

  if (!adminMembership) {
    throw new Error("Only workspace admins can remove members");
  }

  // Prevent removing workspace owner
  const workspace = await Workspace.findById(workspaceId);
  if (workspace && workspace.owner.toString() === memberId.toString()) {
    throw new Error("Cannot remove the workspace owner");
  }

  const Project = require("../models/project.model");
  const ProjectMember = require("../models/projectMember.model");
  const projects = await Project.find({ workspace: workspaceId });
  const projectIds = projects.map(p => p._id);

  // Check sole project lead constraint across all projects first
  for (const pid of projectIds) {
    const pm = await ProjectMember.findOne({ project: pid, user: memberId, role: "TEAM_LEAD", isActive: true });
    if (pm) {
      const activeLeadsCount = await ProjectMember.countDocuments({
        project: pid,
        role: "TEAM_LEAD",
        isActive: true,
      });

      if (activeLeadsCount <= 1) {
        const proj = projects.find(p => p._id.toString() === pid.toString());
        const projName = proj ? proj.name : "the project";
        throw new Error(`Cannot remove this user because they are the sole Project Lead of project "${projName}". Please assign another Project Lead to that project first.`);
      }
    }
  }

  // Soft-delete project memberships for this user
  for (const pid of projectIds) {
    await ProjectMember.findOneAndUpdate(
      { project: pid, user: memberId, isActive: true },
      { isActive: false }
    );
  }

  // Soft delete membership
  const membership = await WorkspaceMember.findOneAndUpdate(
    { workspace: workspaceId, user: memberId, isActive: true },
    { isActive: false },
    { new: true }
  );

  if (!membership) {
    throw new Error("Workspace member not found");
  }
};

const clearWorkspaceData = async (currentUser, workspaceId) => {
  const Project = require("../models/project.model");
  const ProjectMember = require("../models/projectMember.model");
  const Task = require("../models/task.model");
  const Sprint = require("../models/sprint.model");
  const Comment = require("../models/comment.model");
  const Activity = require("../models/activity.model");

  // Check if currentUser is ADMIN of the workspace
  const membership = await WorkspaceMember.findOne({
    workspace: workspaceId,
    user: currentUser._id,
    role: "ADMIN",
    isActive: true,
  });

  if (!membership) {
    throw new Error("Only workspace admins can clear workspace data");
  }

  // Find all projects in workspace
  const projects = await Project.find({ workspace: workspaceId });
  const projectIds = projects.map(p => p._id);

  // Find all tasks in these projects to clear their comments
  const tasks = await Task.find({ project: { $in: projectIds } });
  const taskIds = tasks.map(t => t._id);

  // Perform deletions in order
  await Comment.deleteMany({ task: { $in: taskIds } });
  await Task.deleteMany({ project: { $in: projectIds } });
  await Sprint.deleteMany({ project: { $in: projectIds } });
  await ProjectMember.deleteMany({ project: { $in: projectIds } });
  await Activity.deleteMany({ project: { $in: projectIds } });
  await Project.deleteMany({ workspace: workspaceId });
};

module.exports = {
  createWorkspace,
  getUserWorkspaces,
  getWorkspaceById,
  updateWorkspace,
  deleteWorkspace,
  getWorkspaceMembers,
  updateMemberRole,
  removeMember,
  clearWorkspaceData,
};
const Project = require("../models/project.model");
const ProjectMember = require("../models/projectMember.model");
const Workspace = require("../models/Workspace.model");
const WorkspaceMember = require("../models/workspaceMember.model");
// const Sprint = require("../models/spirint.model");
// const Backlog = require("../models/backlog.model");
// const Task = require("../models/task.model");


/**
 * Create a new project
 */
const createProject = async (data, currentUser) => {
  const {
    workspaceId,
    name,
    projectKey,
    key,
    description,
    startDate,
    endDate,
  } = data;

  // Handle case where frontend passes "key" instead of "projectKey"
  const finalKey = projectKey || key || name?.slice(0, 3).toUpperCase() || "PROJ";

  // Check workspace exists
  const workspace = await Workspace.findById(workspaceId);

  if (!workspace) {
    throw new Error("Workspace not found");
  }

  // Only ADMIN can create projects
  const admin = await WorkspaceMember.findOne({
    workspace: workspaceId,
    user: currentUser._id,
    role: "ADMIN",
    isActive: true,
  });

  if (!admin) {
    throw new Error("Only workspace admins can create projects");
  }

  // Prevent duplicate project names
  const existingProject = await Project.findOne({
    workspace: workspaceId,
    name,
  });

  if (existingProject) {
    throw new Error("Project with this name already exists");
  }

  // Prevent duplicate project keys
  const existingKey = await Project.findOne({
    workspace: workspaceId,
    projectKey: finalKey.toUpperCase(),
  });

  if (existingKey) {
    throw new Error("Project key already exists");
  }

  // Create project
  const project = await Project.create({
    workspace: workspaceId,
    name,
    projectKey: finalKey.toUpperCase(),
    description,
    createdBy: currentUser._id,
    startDate,
    endDate,
  });

  // Creator automatically becomes TEAM_LEAD
  await ProjectMember.create({
    project: project._id,
    user: currentUser._id,
    role: "TEAM_LEAD",
  });

  return project;
};

/**
 * Get all projects for logged-in user
 */
const getUserProjects = async (currentUser) => {
  // Find workspaces where user is ADMIN
  const adminMemberships = await WorkspaceMember.find({
    user: currentUser._id,
    role: "ADMIN",
    isActive: true,
  });
  const adminWorkspaceIds = adminMemberships.map(m => m.workspace);

  // Get projects they are member of
  const memberships = await ProjectMember.find({
    user: currentUser._id,
    isActive: true,
  }).populate("project");

  let projects = memberships.map(m => m.project).filter(Boolean);

  // If admin in any workspaces, get all projects in those workspaces
  if (adminWorkspaceIds.length > 0) {
    const adminProjects = await Project.find({
      workspace: { $in: adminWorkspaceIds },
    });

    // Combine and remove duplicates
    const projectIds = new Set(projects.map(p => p._id.toString()));
    adminProjects.forEach(p => {
      if (!projectIds.has(p._id.toString())) {
        projects.push(p);
      }
    });
  }

  // Construct dummy memberships for workspace admin projects so the frontend gets the expected structure
  const projectMemberships = projects.map(p => {
    const originalMembership = memberships.find(m => m.project && m.project._id.toString() === p._id.toString());
    if (originalMembership) {
      return originalMembership;
    }
    return {
      project: p,
      role: "TEAM_LEAD",
      user: currentUser._id,
      isActive: true,
    };
  });

  return projectMemberships;
};

/**
 * Get project by ID
 */
const getProjectById = async (projectId, currentUser) => {
  const project = await Project.findById(projectId);
  if (!project) {
    throw new Error("Project not found");
  }

  // Check if workspace ADMIN
  const isAdmin = await WorkspaceMember.findOne({
    workspace: project.workspace,
    user: currentUser._id,
    role: "ADMIN",
    isActive: true,
  });

  if (!isAdmin) {
    // Check if project member
    const membership = await ProjectMember.findOne({
      project: projectId,
      user: currentUser._id,
      isActive: true,
    });

    if (!membership) {
      throw new Error("Access denied");
    }
  }

  return project;
};

/**
 * Archive project
 */
const archiveProject = async (projectId, currentUser) => {
  const project = await Project.findById(projectId);

  if (!project) {
    throw new Error("Project not found");
  }

  const admin = await WorkspaceMember.findOne({
    workspace: project.workspace,
    user: currentUser._id,
    role: "ADMIN",
    isActive: true,
  });

  if (!admin) {
    throw new Error("Only workspace admins can archive projects");
  }

  project.status = "ARCHIVED";
  await project.save();

  return project;
};

/**
 * Get project members
 */
const getProjectMembers = async (projectId, currentUser) => {
  const project = await Project.findById(projectId);
  if (!project) {
    throw new Error("Project not found");
  }

  // Check if workspace ADMIN
  const isAdmin = await WorkspaceMember.findOne({
    workspace: project.workspace,
    user: currentUser._id,
    role: "ADMIN",
    isActive: true,
  });

  if (!isAdmin) {
    const access = await ProjectMember.findOne({
      project: projectId,
      user: currentUser._id,
      isActive: true,
    });

    if (!access) {
      throw new Error("Access denied");
    }
  }

  const members = await ProjectMember.find({
    project: projectId,
    isActive: true,
  }).populate("user", "name email");

  return members.map((member) => ({
    id: member.user._id,
    name: member.user.name,
    email: member.user.email,
    role: member.role,
    joinedAt: member.createdAt,
  }));
};




const getProjectDashboard = async (projectId, currentUser) => {
  const project = await Project.findById(projectId);
  if (!project) {
    throw new Error("Project not found");
  }

  // Check if workspace ADMIN
  const isAdmin = await WorkspaceMember.findOne({
    workspace: project.workspace,
    user: currentUser._id,
    role: "ADMIN",
    isActive: true,
  });

  if (!isAdmin) {
    const membership = await ProjectMember.findOne({
      project: projectId,
      user: currentUser._id,
      isActive: true,
    });

    if (!membership) {
      throw new Error("Access denied");
    }
  }

  // Count project leads
  const teamLeads = await ProjectMember.countDocuments({
    project: projectId,
    role: "TEAM_LEAD",
    isActive: true,
  });

  // Count developers
  const developers = await ProjectMember.countDocuments({
    project: projectId,
    role: "DEVELOPER",
    isActive: true,
  });

  return {
    project,
    team: {
      teamLeads,
      developers,
    },
    stats: {
      totalSprints: 0,
      activeSprint: null,
      backlogItems: 0,
      tasks: 0,
    },
  };
};

const checkIsLeadOrAdmin = async (projectId, currentUser) => {
  const project = await Project.findById(projectId);
  if (!project) throw new Error("Project not found");

  const isAdmin = await WorkspaceMember.findOne({
    workspace: project.workspace,
    user: currentUser._id,
    role: "ADMIN",
    isActive: true,
  });

  if (isAdmin) return true;

  const isLead = await ProjectMember.findOne({
    project: projectId,
    user: currentUser._id,
    role: "TEAM_LEAD",
    isActive: true,
  });

  if (isLead) return true;

  throw new Error("Only Project Leads or Workspace Admins can manage project members");
};

const addProjectMember = async (projectId, userId, role, currentUser) => {
  await checkIsLeadOrAdmin(projectId, currentUser);

  // Check if user is active workspace member
  const project = await Project.findById(projectId);
  const isWorkspaceMember = await WorkspaceMember.findOne({
    workspace: project.workspace,
    user: userId,
    isActive: true,
  });

  if (!isWorkspaceMember) {
    throw new Error("User must be an active member of this workspace to be added to a project");
  }

  // Check if they are already in the project (even soft-deleted)
  const existing = await ProjectMember.findOne({ project: projectId, user: userId });
  if (existing) {
    existing.isActive = true;
    existing.role = role || existing.role;
    await existing.save();
    return existing;
  }

  const newMember = await ProjectMember.create({
    project: projectId,
    user: userId,
    role,
  });

  return newMember;
};

const removeProjectMember = async (projectId, userId, currentUser) => {
  await checkIsLeadOrAdmin(projectId, currentUser);

  const member = await ProjectMember.findOne({ project: projectId, user: userId, isActive: true });
  if (!member) {
    throw new Error("Project member not found or already inactive");
  }

  // Ensure we don't leave the project with zero active TEAM_LEADs
  if (member.role === "TEAM_LEAD") {
    const activeLeadsCount = await ProjectMember.countDocuments({
      project: projectId,
      role: "TEAM_LEAD",
      isActive: true,
    });
    if (activeLeadsCount <= 1) {
      throw new Error("Cannot remove the last active Project Lead from the project");
    }
  }

  member.isActive = false;
  await member.save();
  return member;
};

const updateProjectMemberRole = async (projectId, userId, role, currentUser) => {
  await checkIsLeadOrAdmin(projectId, currentUser);

  if (!["TEAM_LEAD", "DEVELOPER"].includes(role)) {
    throw new Error("Invalid project role. Must be TEAM_LEAD or DEVELOPER");
  }

  const member = await ProjectMember.findOne({ project: projectId, user: userId, isActive: true });
  if (!member) {
    throw new Error("Project member not found");
  }

  // Ensure we don't leave the project with zero active TEAM_LEADs if they are demoted
  if (member.role === "TEAM_LEAD" && role === "DEVELOPER") {
    const activeLeadsCount = await ProjectMember.countDocuments({
      project: projectId,
      role: "TEAM_LEAD",
      isActive: true,
    });
    if (activeLeadsCount <= 1) {
      throw new Error("Cannot demote the last active Project Lead from the project");
    }
  }

  member.role = role;
  await member.save();
  return member;
};

/**
 * Update project details
 */
const updateProject = async (projectId, data, currentUser) => {
  const project = await Project.findById(projectId);
  if (!project) {
    throw new Error("Project not found");
  }

  // Check if workspace ADMIN
  const isAdmin = await WorkspaceMember.findOne({
    workspace: project.workspace,
    user: currentUser._id,
    role: "ADMIN",
    isActive: true,
  });

  if (!isAdmin) {
    // Check if Project Lead (TEAM_LEAD)
    const isLead = await ProjectMember.findOne({
      project: projectId,
      user: currentUser._id,
      role: "TEAM_LEAD",
      isActive: true,
    });

    if (!isLead) {
      throw new Error("Only workspace admins and project leads can edit this project");
    }
  }

  // Update fields
  const { name, key, description } = data;
  if (name !== undefined) project.name = name.trim();
  if (key !== undefined) project.projectKey = key.toUpperCase().trim();
  if (description !== undefined) project.description = description.trim();

  await project.save();
  return project;
};

const deleteProject = async (projectId, currentUser) => {
  const Task = require("../models/task.model");
  const Sprint = require("../models/sprint.model");
  const Comment = require("../models/comment.model");
  const Activity = require("../models/activity.model");

  const project = await Project.findById(projectId);
  if (!project) {
    throw new Error("Project not found");
  }

  // Check if workspace ADMIN
  const isAdmin = await WorkspaceMember.findOne({
    workspace: project.workspace,
    user: currentUser._id,
    role: "ADMIN",
    isActive: true,
  });

  if (!isAdmin) {
    // Check if Project Lead (TEAM_LEAD)
    const isLead = await ProjectMember.findOne({
      project: projectId,
      user: currentUser._id,
      role: "TEAM_LEAD",
      isActive: true,
    });

    if (!isLead) {
      throw new Error("Only workspace admins and project leads can delete this project");
    }
  }

  // Delete all tasks and comments
  const tasks = await Task.find({ project: projectId });
  const taskIds = tasks.map(t => t._id);
  await Comment.deleteMany({ task: { $in: taskIds } });
  await Task.deleteMany({ project: projectId });

  // Delete all sprints
  await Sprint.deleteMany({ project: projectId });

  // Delete project members and activity logs
  await ProjectMember.deleteMany({ project: projectId });
  await Activity.deleteMany({ project: projectId });

  // Delete project itself
  await Project.findByIdAndDelete(projectId);
};

module.exports = {
  createProject,
  getUserProjects,
  getProjectById,
  archiveProject,
  getProjectMembers,
  getProjectDashboard,
  addProjectMember,
  removeProjectMember,
  updateProjectMemberRole,
  updateProject,
  deleteProject,
};
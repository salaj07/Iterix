const Sprint = require("../models/sprint.model");
const Project = require("../models/project.model");
const ProjectMember = require("../models/projectMember.model");
const WorkspaceMember = require("../models/workspaceMember.model");
const Task = require("../models/task.model");

/**
 * Create Sprint
 */
const createSprint = async (data, currentUser) => {
  const { projectId, name, goal, startDate, endDate } = data;

  // Check project exists
  const project = await Project.findById(projectId);

  if (!project) {
    throw new Error("Project not found");
  }

  // Check TEAM_LEAD or Workspace ADMIN access
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
      role: "TEAM_LEAD",
      isActive: true,
    });

    if (!membership) {
      throw new Error("Only TEAM_LEAD can create sprints");
    }
  }

  // Prevent duplicate sprint names
  const existingSprint = await Sprint.findOne({
    project: projectId,
    name,
  });

  if (existingSprint) {
    throw new Error("Sprint with this name already exists");
  }

  if (new Date(startDate) >= new Date(endDate)) {
  throw new Error("Start date must be before end date");
}

  const sprint = await Sprint.create({
    project: projectId,
    name,
    goal,
    startDate,
    endDate,
    createdBy: currentUser._id,
  });

  await notifyProjectMembers(
    projectId,
    "New Sprint Created",
    `Sprint "${name}" has been planned in project "${project.name}" by ${currentUser.name || "a team member"}.`,
    currentUser._id
  );

  notifySprintUpdate(projectId, "sprint_created", sprint);
  return sprint;
};

/**
 * Get all sprints for a project
 */
const getProjectSprints = async (projectId, currentUser) => {
  const project = await Project.findById(projectId);
  if (!project) {
    throw new Error("Project not found");
  }

  // Check if workspace ADMIN or TEAM_LEAD
  const isWorkspaceLeadOrAdmin = await WorkspaceMember.findOne({
    workspace: project.workspace,
    user: currentUser._id,
    role: { $in: ["ADMIN", "TEAM_LEAD"] },
    isActive: true,
  });

  if (!isWorkspaceLeadOrAdmin) {
    const membership = await ProjectMember.findOne({
      project: projectId,
      user: currentUser._id,
      isActive: true,
    });

    if (!membership) {
      throw new Error("Access denied");
    }
  }

  return await Sprint.find({ project: projectId }).sort({
    createdAt: -1,
  });
};

/**
 * Start Sprint
 */
const startSprint = async (sprintId, currentUser) => {
  // Find sprint
  const sprint = await Sprint.findById(sprintId);

  if (!sprint) {
    throw new Error("Sprint not found");
  }

  // Sprint must be in PLANNED state
  if (sprint.status !== "PLANNED") {
    throw new Error("Only planned sprints can be started");
  }

  // Check if current user is TEAM_LEAD or Workspace ADMIN
  const project = await Project.findById(sprint.project);
  const isAdmin = project && await WorkspaceMember.findOne({
    workspace: project.workspace,
    user: currentUser._id,
    role: "ADMIN",
    isActive: true,
  });

  if (!isAdmin) {
    const membership = await ProjectMember.findOne({
      project: sprint.project,
      user: currentUser._id,
      role: "TEAM_LEAD",
      isActive: true,
    });

    if (!membership) {
      throw new Error("Only TEAM_LEAD can start a sprint");
    }
  }

  // Ensure no other ACTIVE sprint exists
  const activeSprint = await Sprint.findOne({
    project: sprint.project,
    status: "ACTIVE",
  });

  if (
    activeSprint &&
    activeSprint._id.toString() !== sprintId.toString()
  ) {
    throw new Error("Another sprint is already active");
  }

  // Start the sprint
  sprint.status = "ACTIVE";
  await sprint.save();

  await notifyProjectMembers(
    sprint.project,
    "Sprint Started",
    `Sprint "${sprint.name}" has been started in project "${project?.name || "Project"}" by ${currentUser.name || "a team member"}.`,
    currentUser._id
  );

  notifySprintUpdate(sprint.project, "sprint_updated", sprint);
  return sprint;
};
/**
 * Complete Sprint
 */
const completeSprint = async (sprintId, currentUser) => {
  const sprint = await Sprint.findById(sprintId);

  if (!sprint) {
    throw new Error("Sprint not found");
  }

  // Only ACTIVE sprints can be completed
  if (sprint.status !== "ACTIVE") {
    throw new Error("Only active sprints can be completed");
  }

  // Check TEAM_LEAD or Workspace ADMIN permission
  const project = await Project.findById(sprint.project);
  const isAdmin = project && await WorkspaceMember.findOne({
    workspace: project.workspace,
    user: currentUser._id,
    role: "ADMIN",
    isActive: true,
  });

  if (!isAdmin) {
    const membership = await ProjectMember.findOne({
      project: sprint.project,
      user: currentUser._id,
      role: "TEAM_LEAD",
      isActive: true,
    });

    if (!membership) {
      throw new Error("Only TEAM_LEAD can complete a sprint");
    }
  }

  sprint.status = "COMPLETED";
  await sprint.save();

  // Rollover incomplete tasks to backlog (set sprint = null)
  await Task.updateMany(
    { sprint: sprintId, status: { $ne: "Done" } },
    { sprint: null }
  );

  await notifyProjectMembers(
    sprint.project,
    "Sprint Completed",
    `Sprint "${sprint.name}" has been completed in project "${project?.name || "Project"}" by ${currentUser.name || "a team member"}.`,
    currentUser._id
  );

  notifySprintUpdate(sprint.project, "sprint_updated", sprint);
  return sprint;
};

/**
 * Delete Sprint
 */
const deleteSprint = async (sprintId, currentUser) => {
  const sprint = await Sprint.findById(sprintId);
  if (!sprint) {
    throw new Error("Sprint not found");
  }

  // Check TEAM_LEAD or Workspace ADMIN permission
  const project = await Project.findById(sprint.project);
  const isAdmin = project && await WorkspaceMember.findOne({
    workspace: project.workspace,
    user: currentUser._id,
    role: "ADMIN",
    isActive: true,
  });

  if (!isAdmin) {
    const membership = await ProjectMember.findOne({
      project: sprint.project,
      user: currentUser._id,
      role: "TEAM_LEAD",
      isActive: true,
    });

    if (!membership) {
      throw new Error("Only Project Leads can delete a sprint");
    }
  }

  // Reset tasks assigned to this sprint to null
  await Task.updateMany(
    { sprint: sprintId },
    { sprint: null }
  );

  const projectId = sprint.project;
  // Delete the sprint
  await Sprint.findByIdAndDelete(sprintId);
  notifySprintUpdate(projectId, "sprint_deleted", { id: sprintId });
  return { success: true, sprintId };
};

/**
 * Helper to notify all active project members about sprint events
 */
const notifyProjectMembers = async (projectId, title, message, excludeUserId) => {
  try {
    const { createNotification } = require("./notification.service");
    const members = await ProjectMember.find({ project: projectId, isActive: true });
    for (const m of members) {
      const targetUser = m.user ? m.user.toString() : null;
      if (targetUser && targetUser !== excludeUserId.toString()) {
        await createNotification({
          user: targetUser,
          title,
          message,
          type: "SPRINT",
          projectId,
        });
      }
    }
  } catch (err) {
    console.error("Failed to notify project members:", err);
  }
};

const notifySprintUpdate = (projectId, eventName, sprintDoc) => {
  try {
    const { emitProjectEvent } = require("../socket");
    const sprintObj = sprintDoc.toObject ? sprintDoc.toObject() : sprintDoc;
    emitProjectEvent(projectId, eventName, {
      ...sprintObj,
      id: sprintObj._id || sprintObj.id,
      projectId: sprintObj.project ? String(sprintObj.project) : null,
    });
  } catch (err) {
    console.error("Failed to emit sprint socket event:", err);
  }
};

module.exports = {
  createSprint,
  getProjectSprints,
  startSprint,
  completeSprint,
  deleteSprint,
};
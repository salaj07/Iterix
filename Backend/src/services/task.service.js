const Task = require("../models/task.model");
const Project = require("../models/project.model");
const Sprint = require("../models/sprint.model");
const ProjectMember = require("../models/projectMember.model");

/* ─── Mapping Helpers ────────────────────────────────────────────────── */

const mapTaskToFrontend = (task) => {
  if (!task) return null;
  const t = task.toObject ? task.toObject() : task;

  // Map status
  let status = "Backlog";
  if (t.workflowStage === "SPRINT") {
    if (t.status === "TODO") status = "Todo";
    else if (t.status === "IN_PROGRESS") status = "In Progress";
    else if (t.status === "IN_REVIEW") status = "In Review";
    else if (t.status === "DONE") status = "Done";
  } else {
    status = "Backlog";
  }

  // Map priority
  let priority = "Medium";
  if (t.priority === "LOW") priority = "Low";
  else if (t.priority === "MEDIUM") priority = "Medium";
  else if (t.priority === "HIGH") priority = "High";
  else if (t.priority === "CRITICAL") priority = "Urgent";

  // Map other fields
  const assigneeId = t.assignee && (t.assignee._id || t.assignee);
  const projectId = t.project && (t.project._id || t.project);
  const sprintId = t.sprint && (t.sprint._id || t.sprint);

  return {
    ...t,
    id: t._id,
    status,
    priority,
    projectId: projectId ? String(projectId) : null,
    sprintId: sprintId ? String(sprintId) : null,
    assigneeId: assigneeId ? String(assigneeId) : null,
    reporterId: t.createdBy ? String(t.createdBy) : null,
    points: t.storyPoints || 0,
    archived: t.isArchived || false,
  };
};

const mapFrontendToTaskData = (data) => {
  const mapped = {};
  if (data.title !== undefined) mapped.title = data.title;
  if (data.description !== undefined) mapped.description = data.description;
  
  // Map priority
  if (data.priority !== undefined) {
    const p = String(data.priority).toUpperCase();
    if (p === "LOW") mapped.priority = "LOW";
    else if (p === "MEDIUM") mapped.priority = "MEDIUM";
    else if (p === "HIGH") mapped.priority = "HIGH";
    else if (p === "URGENT" || p === "CRITICAL") mapped.priority = "CRITICAL";
  }

  // Map points / storyPoints
  if (data.points !== undefined) mapped.storyPoints = Number(data.points);
  else if (data.storyPoints !== undefined) mapped.storyPoints = Number(data.storyPoints);
  
  // Map dueDate
  if (data.dueDate !== undefined) mapped.dueDate = data.dueDate;

  // Map project / projectId
  if (data.projectId !== undefined) mapped.project = data.projectId;
  else if (data.project !== undefined) mapped.project = data.project;

  // Map sprint / sprintId
  if (data.sprintId !== undefined) mapped.sprint = data.sprintId || null;

  // Map assignee / assigneeId
  if (data.assigneeId !== undefined) mapped.assignee = data.assigneeId || null;

  // Map status & workflowStage
  if (data.status !== undefined) {
    if (data.status === "Backlog") {
      mapped.workflowStage = "BACKLOG";
      mapped.status = "TODO";
    } else {
      mapped.workflowStage = "SPRINT";
      if (data.status === "Todo") mapped.status = "TODO";
      else if (data.status === "In Progress") mapped.status = "IN_PROGRESS";
      else if (data.status === "In Review") mapped.status = "IN_REVIEW";
      else if (data.status === "Done") mapped.status = "DONE";
    }
  }

  return mapped;
};

/**
 * Create Task
 */
const createTask = async (data, currentUser) => {
  const mappedData = mapFrontendToTaskData(data);

  // Check project exists
  const project = await Project.findById(mappedData.project);

  if (!project) {
    throw new Error("Project not found");
  }

  // Only TEAM_LEAD can create tasks
  const membership = await ProjectMember.findOne({
    project: mappedData.project,
    user: currentUser._id,
    role: "TEAM_LEAD",
    isActive: true,
  });

  if (!membership) {
    throw new Error("Only TEAM_LEAD can create tasks");
  }

  // Generate task code
  project.taskCounter += 1;
  await project.save();

  const taskCode = `${project.projectKey}-${project.taskCounter}`;

  // Create task in DB
  const task = await Task.create({
    ...mappedData,
    taskCode,
    createdBy: currentUser._id,
  });

  return mapTaskToFrontend(task);
};

/**
 * Get all tasks for a project
 */
const getProjectTasks = async (projectId, currentUser) => {
  const membership = await ProjectMember.findOne({
    project: projectId,
    user: currentUser._id,
    isActive: true,
  });

  if (!membership) {
    throw new Error("Access denied");
  }

  const tasks = await Task.find({
    project: projectId,
  })
    .populate("assignee", "name email")
    .sort({ createdAt: -1 });

  return tasks.map(mapTaskToFrontend);
};

/**
 * Assign task to developer
 */
const assignTask = async (taskId, assigneeId, currentUser) => {
  const task = await Task.findById(taskId);

  if (!task) {
    throw new Error("Task not found");
  }

  const lead = await ProjectMember.findOne({
    project: task.project,
    user: currentUser._id,
    role: "TEAM_LEAD",
    isActive: true,
  });

  if (!lead) {
    throw new Error("Only TEAM_LEAD can assign tasks");
  }

  if (assigneeId) {
    // Ensure assignee belongs to the project
    const assigneeMember = await ProjectMember.findOne({
      project: task.project,
      user: assigneeId,
      isActive: true,
    });

    if (!assigneeMember) {
      throw new Error("Assignee is not a member of this project");
    }

    task.assignee = assigneeId;
  } else {
    task.assignee = null;
  }

  await task.save();
  return mapTaskToFrontend(task);
};

/**
 * Move task to sprint
 */
const moveToSprint = async (taskId, sprintId, currentUser) => {
  const task = await Task.findById(taskId);

  if (!task) {
    throw new Error("Task not found");
  }

  const lead = await ProjectMember.findOne({
    project: task.project,
    user: currentUser._id,
    role: "TEAM_LEAD",
    isActive: true,
  });

  if (!lead) {
    throw new Error("Only TEAM_LEAD can move tasks");
  }

  if (sprintId) {
    const sprint = await Sprint.findById(sprintId);

    if (!sprint) {
      throw new Error("Sprint not found");
    }

    if (String(sprint.project) !== String(task.project)) {
      throw new Error("Sprint does not belong to this project");
    }

    task.sprint = sprintId;
    task.workflowStage = "SPRINT";
  } else {
    task.sprint = null;
    task.workflowStage = "BACKLOG";
  }

  await task.save();
  return mapTaskToFrontend(task);
};

/**
 * Change task status
 */
const changeTaskStatus = async (taskId, status, currentUser) => {
  const task = await Task.findById(taskId);

  if (!task) {
    throw new Error("Task not found");
  }

  // Check the logged-in user is the assignee or a TEAM_LEAD
  const isAssignee = task.assignee && String(task.assignee) === String(currentUser._id);
  const lead = await ProjectMember.findOne({
    project: task.project,
    user: currentUser._id,
    role: "TEAM_LEAD",
    isActive: true,
  });

  if (!isAssignee && !lead) {
    throw new Error("Only the assignee or TEAM_LEAD can change task status");
  }

  let dbStatus;
  let dbWorkflowStage = task.workflowStage;

  if (status === "Backlog") {
    dbWorkflowStage = "BACKLOG";
    dbStatus = "TODO";
  } else if (status === "Todo") {
    dbWorkflowStage = "SPRINT";
    dbStatus = "TODO";
  } else if (status === "In Progress") {
    dbWorkflowStage = "SPRINT";
    dbStatus = "IN_PROGRESS";
  } else if (status === "In Review") {
    dbWorkflowStage = "SPRINT";
    dbStatus = "IN_REVIEW";
  } else if (status === "Done") {
    dbWorkflowStage = "SPRINT";
    dbStatus = "DONE";
  } else {
    dbStatus = status;
  }

  // Allowed Kanban transitions (all transitions are allowed between sprint statuses)
  const allowedTransitions = {
    TODO: ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"],
    IN_PROGRESS: ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"],
    IN_REVIEW: ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"],
    DONE: ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"],
  };

  if (task.workflowStage === dbWorkflowStage) {
    const allowed = allowedTransitions[task.status] || [];
    if (task.status !== dbStatus && !allowed.includes(dbStatus)) {
      throw new Error(
        `Cannot change status from ${task.status} to ${dbStatus}`
      );
    }
  }

  task.status = dbStatus;
  task.workflowStage = dbWorkflowStage;
  await task.save();

  return mapTaskToFrontend(task);
};

const approveTask = async (taskId, currentUser) => {
  const task = await Task.findById(taskId);

  if (!task) {
    throw new Error("Task not found");
  }

  // Check if current user is TEAM_LEAD
  const lead = await ProjectMember.findOne({
    project: task.project,
    user: currentUser._id,
    role: "TEAM_LEAD",
    isActive: true,
  });

  if (!lead) {
    throw new Error("Only TEAM_LEAD can approve tasks");
  }

  // Task must be in review
  if (task.status !== "IN_REVIEW") {
    throw new Error("Only tasks in review can be approved");
  }

  task.status = "DONE";
  await task.save();

  return mapTaskToFrontend(task);
};

const requestChanges = async (taskId, currentUser) => {
  const task = await Task.findById(taskId);

  if (!task) {
    throw new Error("Task not found");
  }

  // Check if current user is TEAM_LEAD
  const lead = await ProjectMember.findOne({
    project: task.project,
    user: currentUser._id,
    role: "TEAM_LEAD",
    isActive: true,
  });

  if (!lead) {
    throw new Error("Only TEAM_LEAD can request changes");
  }

  // Task must be in review
  if (task.status !== "IN_REVIEW") {
    throw new Error("Only tasks in review can be sent back");
  }

  task.status = "IN_PROGRESS";
  await task.save();

  return mapTaskToFrontend(task);
};

const updateTask = async (taskId, updateData, currentUser) => {
  const task = await Task.findById(taskId);

  if (!task) {
    throw new Error("Task not found");
  }

  // Check if current user is assignee or TEAM_LEAD
  const isAssignee = task.assignee && String(task.assignee) === String(currentUser._id);
  const lead = await ProjectMember.findOne({
    project: task.project,
    user: currentUser._id,
    role: "TEAM_LEAD",
    isActive: true,
  });

  if (!isAssignee && !lead) {
    throw new Error("Only the assignee or TEAM_LEAD can update task details");
  }

  // Update fields if present in updateData
  if (updateData.title !== undefined) {
    if (!updateData.title.trim()) {
      throw new Error("Title is required");
    }
    task.title = updateData.title.trim();
  }

  if (updateData.description !== undefined) {
    task.description = updateData.description.trim();
  }

  if (updateData.assigneeId !== undefined) {
    task.assignee = updateData.assigneeId || null;
  }

  if (updateData.priority !== undefined) {
    let p = updateData.priority;
    if (p === "Urgent") p = "CRITICAL";
    else p = p.toUpperCase();
    if (["LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(p)) {
      task.priority = p;
    } else {
      throw new Error("Invalid priority");
    }
  }

  if (updateData.points !== undefined) {
    const pts = updateData.points === null ? null : Number(updateData.points);
    if (pts !== null && (isNaN(pts) || pts < 0)) {
      throw new Error("Story points must be a valid positive number");
    }
    task.storyPoints = pts;
  }

  if (updateData.dueDate !== undefined) {
    task.dueDate = updateData.dueDate ? new Date(updateData.dueDate) : null;
  }

  if (updateData.archived !== undefined) {
    task.isArchived = !!updateData.archived;
  }

  if (updateData.sprintId !== undefined) {
    if (updateData.sprintId) {
      const sprint = await Sprint.findById(updateData.sprintId);
      if (!sprint) {
        throw new Error("Sprint not found");
      }
      if (String(sprint.project) !== String(task.project)) {
        throw new Error("Sprint does not belong to this project");
      }
      task.sprint = updateData.sprintId;
      task.workflowStage = "SPRINT";
    } else {
      task.sprint = null;
      task.workflowStage = "BACKLOG";
    }
  }

  if (updateData.status !== undefined) {
    let dbStatus;
    let dbWorkflowStage = task.workflowStage;
    const status = updateData.status;

    if (status === "Backlog") {
      dbWorkflowStage = "BACKLOG";
      dbStatus = "TODO";
    } else if (status === "Todo") {
      dbWorkflowStage = "SPRINT";
      dbStatus = "TODO";
    } else if (status === "In Progress") {
      dbWorkflowStage = "SPRINT";
      dbStatus = "IN_PROGRESS";
    } else if (status === "In Review") {
      dbWorkflowStage = "SPRINT";
      dbStatus = "IN_REVIEW";
    } else if (status === "Done") {
      dbWorkflowStage = "SPRINT";
      dbStatus = "DONE";
    } else {
      dbStatus = status;
    }
    task.status = dbStatus;
    task.workflowStage = dbWorkflowStage;
  }

  await task.save();
  return mapTaskToFrontend(task);
};

module.exports = {
  createTask,
  getProjectTasks,
  assignTask,
  moveToSprint,
  changeTaskStatus,
  approveTask,
  requestChanges,
  updateTask,
};
const Task = require("../models/task.model");
const Project = require("../models/project.model");
const Sprint = require("../models/sprint.model");
const ProjectMember = require("../models/projectMember.model");
const WorkspaceMember = require("../models/workspaceMember.model");
const Comment = require("../models/comment.model");

/* ─── Mapping Helpers ────────────────────────────────────────────────── */

const mapStatusToFrontend = (status) => {
  if (status === "TODO") return "Todo";
  if (status === "IN_PROGRESS") return "In Progress";
  if (status === "IN_REVIEW") return "In Review";
  if (status === "DONE") return "Done";
  return status;
};

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

  // Check if workspace ADMIN
  const isAdmin = await WorkspaceMember.findOne({
    workspace: project.workspace,
    user: currentUser._id,
    role: "ADMIN",
    isActive: true,
  });

  let projectRole = null;
  if (!isAdmin) {
    const membership = await ProjectMember.findOne({
      project: mappedData.project,
      user: currentUser._id,
      isActive: true,
    });

    if (!membership) {
      throw new Error("Access denied. You are not a member of this project.");
    }
    projectRole = membership.role;
  }

  // Developer collaborative rules
  if (projectRole === "DEVELOPER") {
    if (mappedData.assignee && mappedData.assignee.toString() !== currentUser._id.toString()) {
      throw new Error("As a Team Member, you can only assign tasks to yourself or leave them unassigned.");
    }
  }

  // Ensure assignee is not a Workspace Admin unless they are a Project Lead
  if (mappedData.assignee) {
    const isAssigneeAdmin = await WorkspaceMember.findOne({
      workspace: project.workspace,
      user: mappedData.assignee,
      role: "ADMIN",
      isActive: true,
    });

    if (isAssigneeAdmin) {
      const isAssigneeLead = await ProjectMember.findOne({
        project: project._id,
        user: mappedData.assignee,
        role: "TEAM_LEAD",
        isActive: true,
      });

      if (!isAssigneeLead) {
        throw new Error("Cannot assign tasks to workspace admins unless they are Project Leads");
      }
    }
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
    history: [
      {
        at: new Date(),
        by: currentUser._id,
        type: "created",
      },
    ],
  });

  // Notify assignee if not the creator
  if (task.assignee && task.assignee.toString() !== currentUser._id.toString()) {
    try {
      const { createNotification } = require("./notification.service");
      await createNotification({
        user: task.assignee,
        title: "Task Assigned",
        message: `You have been assigned to the task: "${task.title}".`,
        type: "TASK_ASSIGNED",
      });
    } catch (err) {
      console.error("Failed to send assignee notification on task create:", err);
    }
  }

  return mapTaskToFrontend(task);
};

/**
 * Get all tasks for a project
 */
const getProjectTasks = async (projectId, currentUser) => {
  const project = await Project.findById(projectId);
  if (!project) {
    throw new Error("Project not found");
  }

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

  const oldAssignee = task.assignee ? task.assignee.toString() : null;

  const project = await Project.findById(task.project);
  const isAdmin = project && await WorkspaceMember.findOne({
    workspace: project.workspace,
    user: currentUser._id,
    role: "ADMIN",
    isActive: true,
  });

  if (!isAdmin) {
    const lead = await ProjectMember.findOne({
      project: task.project,
      user: currentUser._id,
      role: "TEAM_LEAD",
      isActive: true,
    });

    if (!lead) {
      throw new Error("Only TEAM_LEAD can assign tasks");
    }
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

    // Ensure assignee is not a Workspace Admin unless they are a Project Lead
    const isAssigneeAdmin = await WorkspaceMember.findOne({
      workspace: project.workspace,
      user: assigneeId,
      role: "ADMIN",
      isActive: true,
    });

    if (isAssigneeAdmin) {
      const isAssigneeLead = await ProjectMember.findOne({
        project: task.project,
        user: assigneeId,
        role: "TEAM_LEAD",
        isActive: true,
      });

      if (!isAssigneeLead) {
        throw new Error("Cannot assign tasks to workspace admins unless they are Project Leads");
      }
    }

    task.assignee = assigneeId;
  } else {
    task.assignee = null;
  }

  await task.save();

  const newAssignee = task.assignee ? task.assignee.toString() : null;
  if (newAssignee && newAssignee !== oldAssignee && newAssignee !== currentUser._id.toString()) {
    const { createNotification } = require("./notification.service");
    await createNotification({
      user: newAssignee,
      title: "Task Assigned",
      message: `You have been assigned to the task: "${task.title}".`,
      type: "TASK_ASSIGNED",
    });
  }

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

  const project = await Project.findById(task.project);
  const isAdmin = project && await WorkspaceMember.findOne({
    workspace: project.workspace,
    user: currentUser._id,
    role: "ADMIN",
    isActive: true,
  });

  if (!isAdmin) {
    const lead = await ProjectMember.findOne({
      project: task.project,
      user: currentUser._id,
      role: "TEAM_LEAD",
      isActive: true,
    });

    if (!lead) {
      throw new Error("Only TEAM_LEAD can move tasks to sprints");
    }
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

  // Check the logged-in user is the assignee, a TEAM_LEAD, or a Workspace ADMIN
  const isAssignee = task.assignee && String(task.assignee) === String(currentUser._id);
  const project = await Project.findById(task.project);
  const isAdmin = project && await WorkspaceMember.findOne({
    workspace: project.workspace,
    user: currentUser._id,
    role: "ADMIN",
    isActive: true,
  });

  let isLead = false;
  if (!isAdmin) {
    const lead = await ProjectMember.findOne({
      project: task.project,
      user: currentUser._id,
      role: "TEAM_LEAD",
      isActive: true,
    });
    isLead = !!lead;
  }

  if (!isAssignee && !isLead && !isAdmin) {
    throw new Error("Only the assignee, TEAM_LEAD, or Workspace ADMIN can change task status");
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

  if (task.status !== dbStatus || task.workflowStage !== dbWorkflowStage) {
    const fromStatus = task.workflowStage === "BACKLOG" ? "Backlog" : mapStatusToFrontend(task.status);
    const toStatus = dbWorkflowStage === "BACKLOG" ? "Backlog" : mapStatusToFrontend(dbStatus);
    task.history.push({
      at: new Date(),
      by: currentUser._id,
      type: "status_change",
      from: fromStatus,
      to: toStatus,
    });
  }

  if (dbStatus === "DONE" && !isLead && !isAdmin) {
    throw new Error("Only Project Leads or Workspace Admins can approve tasks and move them to Done");
  }

  const oldStatus = task.status;
  task.status = dbStatus;
  task.workflowStage = dbWorkflowStage;
  await task.save();

  if (oldStatus !== dbStatus) {
    const { createNotification } = require("./notification.service");
    const projectLeads = await ProjectMember.find({
      project: task.project,
      role: "TEAM_LEAD",
      isActive: true,
    });

    if (dbStatus === "IN_REVIEW") {
      for (const lead of projectLeads) {
        if (lead.user && lead.user.toString() !== currentUser._id.toString()) {
          await createNotification({
            user: lead.user,
            title: "Task in Review",
            message: `Task "${task.title}" has been moved to In Review.`,
            type: "SPRINT",
          });
        }
      }
    } else if (dbStatus === "DONE") {
      for (const lead of projectLeads) {
        if (lead.user && lead.user.toString() !== currentUser._id.toString()) {
          await createNotification({
            user: lead.user,
            title: "Task Completed",
            message: `Task "${task.title}" has been moved to Done.`,
            type: "TASK_APPROVED",
          });
        }
      }
    }
  }

  return mapTaskToFrontend(task);
};

const approveTask = async (taskId, currentUser) => {
  const task = await Task.findById(taskId);

  if (!task) {
    throw new Error("Task not found");
  }

  // Check if current user is TEAM_LEAD or Workspace ADMIN
  const project = await Project.findById(task.project);
  const isAdmin = project && await WorkspaceMember.findOne({
    workspace: project.workspace,
    user: currentUser._id,
    role: "ADMIN",
    isActive: true,
  });

  if (!isAdmin) {
    const lead = await ProjectMember.findOne({
      project: task.project,
      user: currentUser._id,
      role: "TEAM_LEAD",
      isActive: true,
    });

    if (!lead) {
      throw new Error("Only TEAM_LEAD can approve tasks");
    }
  }

  // Task must be in review
  if (task.status !== "IN_REVIEW") {
    throw new Error("Only tasks in review can be approved");
  }

  task.history.push({
    at: new Date(),
    by: currentUser._id,
    type: "approved",
  });
  task.status = "DONE";
  await task.save();

  const { createNotification } = require("./notification.service");
  
  // Notify project leads
  const projectLeads = await ProjectMember.find({
    project: task.project,
    role: "TEAM_LEAD",
    isActive: true,
  });

  for (const lead of projectLeads) {
    if (lead.user && lead.user.toString() !== currentUser._id.toString()) {
      await createNotification({
        user: lead.user,
        title: "Task Approved",
        message: `Task "${task.title}" has been approved.`,
        type: "TASK_APPROVED",
      });
    }
  }

  // Notify assignee
  if (task.assignee && task.assignee.toString() !== currentUser._id.toString()) {
    await createNotification({
      user: task.assignee,
      title: "Task Approved",
      message: `Your task "${task.title}" has been approved by ${currentUser.name || "Project Lead"}.`,
      type: "TASK_APPROVED",
    });
  }

  return mapTaskToFrontend(task);
};

const requestChanges = async (taskId, note, currentUser) => {
  const task = await Task.findById(taskId);

  if (!task) {
    throw new Error("Task not found");
  }

  // Check if current user is TEAM_LEAD or Workspace ADMIN
  const project = await Project.findById(task.project);
  const isAdmin = project && await WorkspaceMember.findOne({
    workspace: project.workspace,
    user: currentUser._id,
    role: "ADMIN",
    isActive: true,
  });

  if (!isAdmin) {
    const lead = await ProjectMember.findOne({
      project: task.project,
      user: currentUser._id,
      role: "TEAM_LEAD",
      isActive: true,
    });

    if (!lead) {
      throw new Error("Only TEAM_LEAD can request changes");
    }
  }

  // Task must be in review
  if (task.status !== "IN_REVIEW") {
    throw new Error("Only tasks in review can be sent back");
  }

  task.history.push({
    at: new Date(),
    by: currentUser._id,
    type: "rejected",
    note: note || "",
  });
  task.status = "IN_PROGRESS";
  await task.save();

  const { createNotification } = require("./notification.service");

  // Notify project leads
  const projectLeads = await ProjectMember.find({
    project: task.project,
    role: "TEAM_LEAD",
    isActive: true,
  });

  for (const lead of projectLeads) {
    if (lead.user && lead.user.toString() !== currentUser._id.toString()) {
      await createNotification({
        user: lead.user,
        title: "Changes Requested",
        message: `Changes were requested on task "${task.title}".`,
        type: "TASK_REJECTED",
      });
    }
  }

  // Notify assignee
  if (task.assignee && task.assignee.toString() !== currentUser._id.toString()) {
    await createNotification({
      user: task.assignee,
      title: "Changes Requested",
      message: `Changes were requested on "${task.title}": "${note || ""}"`,
      type: "TASK_REJECTED",
    });
  }

  return mapTaskToFrontend(task);
};

const updateTask = async (taskId, updateData, currentUser) => {
  const task = await Task.findById(taskId);

  if (!task) {
    throw new Error("Task not found");
  }

  const oldAssignee = task.assignee ? task.assignee.toString() : null;

  // Check if current user is assignee, TEAM_LEAD, or Workspace ADMIN
  const isAssignee = task.assignee && String(task.assignee) === String(currentUser._id);
  const project = await Project.findById(task.project);
  const isAdmin = project && await WorkspaceMember.findOne({
    workspace: project.workspace,
    user: currentUser._id,
    role: "ADMIN",
    isActive: true,
  });

  let isLead = false;
  let isDeveloper = false;
  if (!isAdmin) {
    const membership = await ProjectMember.findOne({
      project: task.project,
      user: currentUser._id,
      isActive: true,
    });

    if (!membership) {
      throw new Error("Access denied. You are not a member of this project.");
    }
    isLead = membership.role === "TEAM_LEAD";
    isDeveloper = membership.role === "DEVELOPER";
  }

  if (!isAssignee && !isLead && !isAdmin) {
    throw new Error("Only the assignee, TEAM_LEAD, or Workspace ADMIN can update task details");
  }

  // Scoped Team Member / Developer restrictions
  if (isDeveloper) {
    if (updateData.priority !== undefined) {
      throw new Error("Only Project Leads or Workspace Admins can change task priority");
    }
    if (updateData.points !== undefined || updateData.storyPoints !== undefined) {
      throw new Error("Only Project Leads or Workspace Admins can change task points");
    }
    if (updateData.sprintId !== undefined) {
      throw new Error("Only Project Leads or Workspace Admins can move tasks to sprints");
    }
    if (updateData.archived !== undefined) {
      throw new Error("Only Project Leads or Workspace Admins can archive tasks");
    }
    if (updateData.status === "Done") {
      throw new Error("Only Project Leads or Workspace Admins can approve tasks and move them to Done");
    }
    if (updateData.assigneeId !== undefined && updateData.assigneeId !== null && String(updateData.assigneeId) !== String(currentUser._id)) {
      throw new Error("As a Team Member, you can only assign tasks to yourself or leave them unassigned.");
    }
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
    if (updateData.assigneeId) {
      const isAssigneeAdmin = await WorkspaceMember.findOne({
        workspace: project.workspace,
        user: updateData.assigneeId,
        role: "ADMIN",
        isActive: true,
      });

      if (isAssigneeAdmin) {
        const isAssigneeLead = await ProjectMember.findOne({
          project: project._id,
          user: updateData.assigneeId,
          role: "TEAM_LEAD",
          isActive: true,
        });

        if (!isAssigneeLead) {
          throw new Error("Cannot assign tasks to workspace admins unless they are Project Leads");
        }
      }
    }
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
    if (task.isArchived !== !!updateData.archived) {
      task.history.push({
        at: new Date(),
        by: currentUser._id,
        type: updateData.archived ? "archived" : "unarchived",
      });
    }
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
    const oldStatus = task.status;
    if (task.status !== dbStatus || task.workflowStage !== dbWorkflowStage) {
      const fromStatus = task.workflowStage === "BACKLOG" ? "Backlog" : mapStatusToFrontend(task.status);
      const toStatus = dbWorkflowStage === "BACKLOG" ? "Backlog" : mapStatusToFrontend(dbStatus);
      task.history.push({
        at: new Date(),
        by: currentUser._id,
        type: "status_change",
        from: fromStatus,
        to: toStatus,
      });
      task.status = dbStatus;
      task.workflowStage = dbWorkflowStage;

      if (oldStatus !== dbStatus) {
        try {
          const { createNotification } = require("./notification.service");
          const projectLeads = await ProjectMember.find({
            project: task.project,
            role: "TEAM_LEAD",
            isActive: true,
          });

          if (dbStatus === "IN_REVIEW") {
            for (const lead of projectLeads) {
              if (lead.user && lead.user.toString() !== currentUser._id.toString()) {
                await createNotification({
                  user: lead.user,
                  title: "Task in Review",
                  message: `Task "${task.title}" has been moved to In Review.`,
                  type: "SPRINT",
                });
              }
            }
          } else if (dbStatus === "DONE") {
            for (const lead of projectLeads) {
              if (lead.user && lead.user.toString() !== currentUser._id.toString()) {
                await createNotification({
                  user: lead.user,
                  title: "Task Completed",
                  message: `Task "${task.title}" has been moved to Done.`,
                  type: "TASK_APPROVED",
                });
              }
            }
          }
        } catch (err) {
          console.error("Failed to send status change notifications in updateTask:", err);
        }
      }
    }
  }

  await task.save();

  const newAssignee = task.assignee ? task.assignee.toString() : null;
  if (newAssignee && newAssignee !== oldAssignee && newAssignee !== currentUser._id.toString()) {
    try {
      const { createNotification } = require("./notification.service");
      await createNotification({
        user: newAssignee,
        title: "Task Assigned",
        message: `You have been assigned to the task: "${task.title}".`,
        type: "TASK_ASSIGNED",
      });
    } catch (err) {
      console.error("Failed to send assignee notification on task update:", err);
    }
  }

  return mapTaskToFrontend(task);
};

/**
 * Delete Task
 */
const deleteTask = async (taskId, currentUser) => {
  const task = await Task.findById(taskId);

  if (!task) {
    throw new Error("Task not found");
  }

  const project = await Project.findById(task.project);
  if (!project) {
    throw new Error("Project not found");
  }

  const isWorkspaceAdmin = await WorkspaceMember.findOne({
    workspace: project.workspace,
    user: currentUser._id,
    role: "ADMIN",
    isActive: true,
  });

  const isProjectLead = await ProjectMember.findOne({
    project: task.project,
    user: currentUser._id,
    role: "TEAM_LEAD",
    isActive: true,
  });

  if (!isWorkspaceAdmin && !isProjectLead) {
    throw new Error("Only TEAM_LEAD or Workspace ADMIN can delete tasks");
  }

  await Task.findByIdAndDelete(taskId);
  await Comment.deleteMany({ task: taskId });
  return { id: taskId };
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
  deleteTask,
};
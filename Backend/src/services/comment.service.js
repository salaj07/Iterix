const Comment = require("../models/comment.model");
const Task = require("../models/task.model");
const ProjectMember = require("../models/projectMember.model");
const WorkspaceMember = require("../models/workspaceMember.model");
const Project = require("../models/project.model");

/**
 * Add Comment
 */
const addComment = async ({ taskId, content }, currentUser) => {
  const task = await Task.findById(taskId);

  if (!task) {
    throw new Error("Task not found");
  }

  // Only project members can comment
  const member = await ProjectMember.findOne({
    project: task.project,
    user: currentUser._id,
    isActive: true,
  });

  if (!member) {
    throw new Error("Access denied");
  }

  const comment = await Comment.create({
    task: taskId,
    user: currentUser._id,
    message: content,
  });

  // Notify assignee of the task
  if (task.assignee && task.assignee.toString() !== currentUser._id.toString()) {
    try {
      const { createNotification } = require("./notification.service");
      await createNotification({
        user: task.assignee,
        title: "New Comment",
        message: `${currentUser.name || "Someone"} commented on your task: "${task.title}".`,
        type: "COMMENT",
        projectId: task.project,
        taskId: task._id,
      });
    } catch (err) {
      console.error("Failed to create comment notification:", err);
    }
  }

  return comment;
};

/**
 * Get Comments
 */
const getComments = async (taskId, currentUser) => {
  const task = await Task.findById(taskId);

  if (!task) {
    throw new Error("Task not found");
  }

  const project = await Project.findById(task.project);
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
    const member = await ProjectMember.findOne({
      project: task.project,
      user: currentUser._id,
      isActive: true,
    });

    if (!member) {
      throw new Error("Access denied");
    }
  }

  return await Comment.find({ task: taskId })
    .populate("user", "name email")
    .sort({ createdAt: 1 });
};

module.exports = {
  addComment,
  getComments,
};
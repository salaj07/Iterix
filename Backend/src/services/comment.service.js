const Comment = require("../models/comment.model");
const Task = require("../models/task.model");
const ProjectMember = require("../models/projectMember.model");

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

  return await Comment.create({
    task: taskId,
    user: currentUser._id,
    message: content,
  });
};

/**
 * Get Comments
 */
const getComments = async (taskId, currentUser) => {
  const task = await Task.findById(taskId);

  if (!task) {
    throw new Error("Task not found");
  }

  const member = await ProjectMember.findOne({
    project: task.project,
    user: currentUser._id,
    isActive: true,
  });

  if (!member) {
    throw new Error("Access denied");
  }

  return await Comment.find({ task: taskId })
    .populate("user", "name email")
    .sort({ createdAt: 1 });
};

module.exports = {
  addComment,
  getComments,
};
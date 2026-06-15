const taskService = require("../services/task.service");

/**
 * Create Task
 */
const createTask = async (req, res, next) => {
  try {
    const task = await taskService.createTask(req.body, req.user);

    return res.status(201).json({
      success: true,
      message: "Task created successfully",
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Project Tasks
 */
const getProjectTasks = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const tasks = await taskService.getProjectTasks(
      projectId,
      req.user
    );

    return res.status(200).json({
      success: true,
      data: tasks,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Assign Task
 */
const assignTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { assigneeId } = req.body;

    const task = await taskService.assignTask(
      taskId,
      assigneeId,
      req.user
    );

    return res.status(200).json({
      success: true,
      message: "Task assigned successfully",
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Move Task to Sprint
 */
const moveToSprint = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { sprintId } = req.body;

    const task = await taskService.moveToSprint(
      taskId,
      sprintId,
      req.user
    );

    return res.status(200).json({
      success: true,
      message: "Task moved to sprint successfully",
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Change Task Status
 */
const changeTaskStatus = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;

    const task = await taskService.changeTaskStatus(
      taskId,
      status,
      req.user
    );

    return res.status(200).json({
      success: true,
      message: "Task status updated successfully",
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

const approveTask = async (req, res, next) => {
  try {
    const task = await taskService.approveTask(
      req.params.taskId,
      req.user
    );

    res.status(200).json({
      success: true,
      message: "Task approved successfully",
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

const requestChanges = async (req, res, next) => {
  try {
    const task = await taskService.requestChanges(
      req.params.taskId,
      req.body.note,
      req.user
    );

    res.status(200).json({
      success: true,
      message: "Changes requested successfully",
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

const updateTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const task = await taskService.updateTask(taskId, req.body, req.user);
    res.status(200).json({
      success: true,
      message: "Task updated successfully",
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete Task
 */
const deleteTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const result = await taskService.deleteTask(taskId, req.user);

    return res.status(200).json({
      success: true,
      message: "Task deleted successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTask,
  getProjectTasks,
  assignTask,
  moveToSprint,
  changeTaskStatus,
  requestChanges,
  approveTask,
  updateTask,
  deleteTask,
};
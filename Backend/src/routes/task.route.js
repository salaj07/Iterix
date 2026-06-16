const express = require("express");
const router = express.Router();

const taskController = require("../controller/task.controller");
const { protect } = require("../middleware/auth.middleware");
const { validate } = require("../middleware/validate.middleware");
const {
  createTaskRules,
  changeStatusRules,
  assignTaskRules,
  taskIdRules,
} = require("../validators/task.validator");

// Create Task
router.post("/", protect, createTaskRules, validate, taskController.createTask);

// Get Tasks for a Project
router.get("/project/:projectId", protect, taskController.getProjectTasks);

// Assign Task
router.patch("/:taskId/assign", protect, assignTaskRules, validate, taskController.assignTask);

// Move Task to Sprint
router.patch("/:taskId/move-to-sprint", protect, taskIdRules, validate, taskController.moveToSprint);

// Change Task Status
router.patch("/:taskId/status", protect, changeStatusRules, validate, taskController.changeTaskStatus);

// Approve task
router.patch("/:taskId/approve", protect, taskIdRules, validate, taskController.approveTask);

// Request changes
router.patch("/:taskId/request-changes", protect, taskIdRules, validate, taskController.requestChanges);

// Update Task
router.patch("/:taskId", protect, taskIdRules, validate, taskController.updateTask);

// Delete Task
router.delete("/:taskId", protect, taskIdRules, validate, taskController.deleteTask);

module.exports = router;
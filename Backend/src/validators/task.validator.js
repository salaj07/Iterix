const { body, param } = require("express-validator");

const VALID_STATUSES = ["Backlog", "Todo", "In Progress", "In Review", "Done"];
const VALID_PRIORITIES = [
  "low", "medium", "high", "critical", "urgent",
  "Low", "Medium", "High", "Critical", "Urgent",
  "LOW", "MEDIUM", "HIGH", "CRITICAL", "URGENT"
];

/** POST /api/tasks */
const createTaskRules = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Task title is required")
    .isLength({ max: 200 })
    .withMessage("Task title must be at most 200 characters"),

  body("projectId")
    .notEmpty()
    .withMessage("Project ID is required")
    .isMongoId()
    .withMessage("Invalid project ID"),

  body("sprintId")
    .optional({ nullable: true })
    .isMongoId()
    .withMessage("Invalid sprint ID"),

  body("status")
    .optional()
    .isIn(VALID_STATUSES)
    .withMessage(`Status must be one of: ${VALID_STATUSES.join(", ")}`),

  body("priority")
    .optional()
    .isIn(VALID_PRIORITIES)
    .withMessage(`Priority must be one of: ${VALID_PRIORITIES.join(", ")}`),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage("Description must be at most 5000 characters"),

  body("dueDate")
    .optional({ nullable: true })
    .isISO8601()
    .withMessage("Due date must be a valid ISO 8601 date"),
];

/** PATCH /api/tasks/:taskId/status */
const changeStatusRules = [
  param("taskId")
    .isMongoId()
    .withMessage("Invalid task ID"),

  body("status")
    .notEmpty()
    .withMessage("Status is required")
    .isIn(VALID_STATUSES)
    .withMessage(`Status must be one of: ${VALID_STATUSES.join(", ")}`),
];

/** PATCH /api/tasks/:taskId/assign */
const assignTaskRules = [
  param("taskId")
    .isMongoId()
    .withMessage("Invalid task ID"),

  body("assigneeId")
    .optional({ nullable: true })
    .custom((val) => val === null || val === "" || /^[0-9a-fA-F]{24}$/.test(val))
    .withMessage("Invalid assignee ID"),
];

/** Param validator for routes with :taskId */
const taskIdRules = [
  param("taskId")
    .isMongoId()
    .withMessage("Invalid task ID"),
];

module.exports = { createTaskRules, changeStatusRules, assignTaskRules, taskIdRules };

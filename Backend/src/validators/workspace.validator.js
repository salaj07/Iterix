const { body, param } = require("express-validator");

/** POST /api/workspaces */
const createWorkspaceRules = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Workspace name is required")
    .isLength({ max: 100 })
    .withMessage("Workspace name must be at most 100 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description must be at most 500 characters"),
];

/** PATCH /api/workspaces/:workspaceId */
const updateWorkspaceRules = [
  param("workspaceId")
    .isMongoId()
    .withMessage("Invalid workspace ID"),

  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Workspace name cannot be empty")
    .isLength({ max: 100 })
    .withMessage("Workspace name must be at most 100 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description must be at most 500 characters"),
];

/** GET/DELETE /api/workspaces/:workspaceId */
const workspaceIdRules = [
  param("workspaceId")
    .isMongoId()
    .withMessage("Invalid workspace ID"),
];

module.exports = { createWorkspaceRules, updateWorkspaceRules, workspaceIdRules };

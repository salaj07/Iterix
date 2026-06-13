const { body, param } = require("express-validator");

/** POST /api/projects */
const createProjectRules = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Project name is required")
    .isLength({ max: 150 })
    .withMessage("Project name must be at most 150 characters"),

  body("workspaceId")
    .notEmpty()
    .withMessage("Workspace ID is required")
    .isMongoId()
    .withMessage("Invalid workspace ID"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Description must be at most 1000 characters"),

  body("key")
    .optional()
    .trim()
    .isLength({ min: 2, max: 10 })
    .withMessage("Project key must be 2–10 characters")
    .isAlphanumeric()
    .withMessage("Project key must be alphanumeric"),
];

/** Param validator for routes with :projectId */
const projectIdRules = [
  param("projectId")
    .isMongoId()
    .withMessage("Invalid project ID"),
];

module.exports = { createProjectRules, projectIdRules };

const { body, param } = require("express-validator");

/** POST /api/sprints */
const createSprintRules = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Sprint name is required")
    .isLength({ max: 100 })
    .withMessage("Sprint name must be at most 100 characters"),

  body("projectId")
    .notEmpty()
    .withMessage("Project ID is required")
    .isMongoId()
    .withMessage("Invalid project ID"),

  body("startDate")
    .notEmpty()
    .withMessage("Start date is required")
    .isISO8601()
    .withMessage("Start date must be a valid ISO 8601 date"),

  body("endDate")
    .notEmpty()
    .withMessage("End date is required")
    .isISO8601()
    .withMessage("End date must be a valid ISO 8601 date")
    .custom((endDate, { req }) => {
      if (req.body.startDate && new Date(endDate) <= new Date(req.body.startDate)) {
        throw new Error("End date must be after start date");
      }
      return true;
    }),

  body("goal")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Sprint goal must be at most 500 characters"),
];

/** Param validator for routes with :sprintId */
const sprintIdRules = [
  param("sprintId")
    .isMongoId()
    .withMessage("Invalid sprint ID"),
];

module.exports = { createSprintRules, sprintIdRules };

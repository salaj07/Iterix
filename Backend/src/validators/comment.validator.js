const { body, param } = require("express-validator");

/** POST /api/comments */
const addCommentRules = [
  body("content")
    .trim()
    .notEmpty()
    .withMessage("Comment content is required")
    .isLength({ max: 2000 })
    .withMessage("Comment must be at most 2000 characters"),

  body("taskId")
    .notEmpty()
    .withMessage("Task ID is required")
    .isMongoId()
    .withMessage("Invalid task ID"),
];

/** Param validator for GET /api/comments/task/:taskId */
const taskIdParamRules = [
  param("taskId")
    .isMongoId()
    .withMessage("Invalid task ID"),
];

module.exports = { addCommentRules, taskIdParamRules };

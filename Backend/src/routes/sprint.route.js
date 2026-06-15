const express = require("express");
const router = express.Router();

const sprintController = require("../controller/sprint.controller");
const { protect } = require("../middleware/auth.middleware");
const { validate } = require("../middleware/validate.middleware");
const { createSprintRules, sprintIdRules } = require("../validators/sprint.validator");

// Create Sprint
router.post("/", protect, createSprintRules, validate, sprintController.createSprint);

// Get all sprints of a project
router.get("/project/:projectId", protect, sprintController.getProjectSprints);

// Start Sprint
router.patch("/:sprintId/start", protect, sprintIdRules, validate, sprintController.startSprint);

// Complete Sprint
router.patch("/:sprintId/complete", protect, sprintIdRules, validate, sprintController.completeSprint);

// Delete Sprint
router.delete("/:sprintId", protect, sprintIdRules, validate, sprintController.deleteSprint);

module.exports = router;
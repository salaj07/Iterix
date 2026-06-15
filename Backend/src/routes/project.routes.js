const express = require("express");
const router = express.Router();

const projectController = require("../controller/project.controller");
const { protect } = require("../middleware/auth.middleware");
const { validate } = require("../middleware/validate.middleware");
const { createProjectRules, projectIdRules } = require("../validators/project.validator");

// Create Project
router.post("/", protect, createProjectRules, validate, projectController.createProject);

// Get Logged-in User Projects
router.get("/", protect, projectController.getUserProjects);

// Get Project Dashboard
router.get("/:projectId/dashboard", protect, projectIdRules, validate, projectController.getProjectDashboard);

// Get Project Members
router.get("/:projectId/members", protect, projectIdRules, validate, projectController.getProjectMembers);

// Add Project Member
router.post("/:projectId/members", protect, projectIdRules, validate, projectController.addProjectMember);

// Update Project Member Role
router.patch("/:projectId/members/:userId", protect, projectIdRules, validate, projectController.updateProjectMemberRole);

// Remove Project Member
router.delete("/:projectId/members/:userId", protect, projectIdRules, validate, projectController.removeProjectMember);

// Get Project By ID
router.get("/:projectId", protect, projectIdRules, validate, projectController.getProjectById);

// Archive Project
router.patch("/:projectId/archive", protect, projectIdRules, validate, projectController.archiveProject);

module.exports = router;
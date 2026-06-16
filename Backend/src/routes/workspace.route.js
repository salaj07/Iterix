const express = require("express");
const router = express.Router();

const workspaceController = require("../controller/workspace.controller");
const { protect } = require("../middleware/auth.middleware");
const { validate } = require("../middleware/validate.middleware");
const {
  createWorkspaceRules,
  updateWorkspaceRules,
  workspaceIdRules,
} = require("../validators/workspace.validator");

// Create Workspace
router.post("/", protect, createWorkspaceRules, validate, workspaceController.createWorkspace);

// Get all workspaces for logged-in user
router.get("/", protect, workspaceController.getUserWorkspaces);

// Get workspace members
router.get("/:workspaceId/members", protect, workspaceIdRules, validate, workspaceController.getWorkspaceMembers);

// Get single workspace
router.get("/:workspaceId", protect, workspaceIdRules, validate, workspaceController.getWorkspaceById);

// Update workspace
router.patch("/:workspaceId", protect, updateWorkspaceRules, validate, workspaceController.updateWorkspace);

// Delete workspace
router.delete("/:workspaceId", protect, workspaceIdRules, validate, workspaceController.deleteWorkspace);

// Update member role in workspace
router.patch("/:workspaceId/members/:memberId", protect, workspaceIdRules, validate, workspaceController.updateMemberRole);

// Remove member from workspace
router.delete("/:workspaceId/members/:memberId", protect, workspaceIdRules, validate, workspaceController.removeMember);

module.exports = router;
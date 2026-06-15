const express = require("express");
const router = express.Router();

const invitationController = require("../controller/invitation.controller");
const { protect } = require("../middleware/auth.middleware");
const { validate } = require("../middleware/validate.middleware");
const { inviteMemberRules, invitationIdRules } = require("../validators/invitation.validator");

// Invite a user to a workspace
router.post(
  "/workspaces/:workspaceId/invite",
  protect,
  inviteMemberRules,
  validate,
  invitationController.inviteMember
);

// Get logged-in user's invitations
router.get("/invitations", protect, invitationController.getMyInvitations);

// Accept invitation
router.post(
  "/invitations/:invitationId/accept",
  protect,
  invitationIdRules,
  validate,
  invitationController.acceptInvitation
);

// Reject invitation
router.post(
  "/invitations/:invitationId/reject",
  protect,
  invitationIdRules,
  validate,
  invitationController.rejectInvitation
);

module.exports = router;
const { body, param } = require("express-validator");

const VALID_ROLES = [
  "admin", "member", "viewer",
  "ADMIN", "MEMBER", "TEAM_LEAD", "DEVELOPER",
  "team_lead", "developer"
];

/** POST /api/workspaces/:workspaceId/invite */
const inviteMemberRules = [
  param("workspaceId")
    .isMongoId()
    .withMessage("Invalid workspace ID"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Invitee email is required")
    .isEmail()
    .withMessage("Must be a valid email address")
    .normalizeEmail(),

  body("role")
    .optional()
    .isIn(VALID_ROLES)
    .withMessage(`Role must be one of: ${VALID_ROLES.join(", ")}`),
];

/** Param validator for accept/reject routes */
const invitationIdRules = [
  param("invitationId")
    .isMongoId()
    .withMessage("Invalid invitation ID"),
];

module.exports = { inviteMemberRules, invitationIdRules };

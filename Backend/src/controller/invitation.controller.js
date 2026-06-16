const invitationService = require("../services/invitation.service");

/**
 * Invite a member to a workspace
 */
const inviteMember = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const { email, role } = req.body;

    const result = await invitationService.inviteMember(
      workspaceId,
      req.user,
      email,
      role
    );

    return res.status(201).json({
      success: true,
      message: "Invitation sent successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get logged-in user's pending invitations
 */
const getMyInvitations = async (req, res, next) => {
  try {
    const invitations = await invitationService.getMyInvitations(req.user);

    return res.status(200).json({
      success: true,
      data: invitations,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Accept invitation
 */
const acceptInvitation = async (req, res, next) => {
  try {
    const { invitationId } = req.params;

    const result = await invitationService.acceptInvitation(
      invitationId,
      req.user
    );

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reject invitation
 */
const rejectInvitation = async (req, res, next) => {
  try {
    const { invitationId } = req.params;

    const result = await invitationService.rejectInvitation(
      invitationId,
      req.user
    );

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get invitations sent by a specific workspace
 */
const getWorkspaceInvitations = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const invitations = await invitationService.getWorkspaceInvitations(
      workspaceId,
      req.user
    );

    return res.status(200).json({
      success: true,
      data: invitations,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  inviteMember,
  getMyInvitations,
  acceptInvitation,
  rejectInvitation,
  getWorkspaceInvitations,
};
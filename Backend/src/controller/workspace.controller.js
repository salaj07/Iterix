const workspaceService = require("../services/workspace.service");

const createWorkspace = async (req, res, next) => {
  try {
    const result = await workspaceService.createWorkspace(
      req.user,
      req.body
    );

    res.status(201).json({
      success: true,
      message: "Workspace created successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getUserWorkspaces = async (req, res, next) => {
  try {
    const result = await workspaceService.getUserWorkspaces(req.user);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getWorkspaceById = async (req, res, next) => {
  try {
    const result = await workspaceService.getWorkspaceById(
      req.user,
      req.params.workspaceId
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const updateWorkspace = async (req, res, next) => {
  try {
    const result = await workspaceService.updateWorkspace(
      req.user,
      req.params.workspaceId,
      req.body
    );

    res.status(200).json({
      success: true,
      message: "Workspace updated successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const deleteWorkspace = async (req, res, next) => {
  try {
    await workspaceService.deleteWorkspace(
      req.user,
      req.params.workspaceId
    );

    res.status(200).json({
      success: true,
      message: "Workspace deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

const getWorkspaceMembers = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;

    const members = await workspaceService.getWorkspaceMembers(
      workspaceId,
      req.user
    );

    return res.status(200).json({
      success: true,
      data: members,
    });
  } catch (error) {
    next(error);
  }
};

const updateMemberRole = async (req, res, next) => {
  try {
    const { workspaceId, memberId } = req.params;
    const { role } = req.body;

    const result = await workspaceService.updateMemberRole(
      workspaceId,
      req.user,
      memberId,
      role
    );

    res.status(200).json({
      success: true,
      message: "Member role updated successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const removeMember = async (req, res, next) => {
  try {
    const { workspaceId, memberId } = req.params;

    await workspaceService.removeMember(
      workspaceId,
      req.user,
      memberId
    );

    res.status(200).json({
      success: true,
      message: "Member removed from workspace successfully",
    });
  } catch (error) {
    next(error);
  }
};

const clearWorkspaceData = async (req, res, next) => {
  try {
    await workspaceService.clearWorkspaceData(
      req.user,
      req.params.workspaceId
    );

    res.status(200).json({
      success: true,
      message: "Workspace data cleared successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createWorkspace,
  getUserWorkspaces,
  getWorkspaceById,
  updateWorkspace,
  deleteWorkspace,
  getWorkspaceMembers,
  updateMemberRole,
  removeMember,
  clearWorkspaceData,
};

const joinRequestService = require("../services/joinRequest.service");

const createJoinRequest = async (req, res, next) => {
  try {
    const { workspaceId } = req.body;
    if (!workspaceId) {
      return res.status(400).json({ success: false, message: "Workspace ID is required" });
    }

    const result = await joinRequestService.createJoinRequest(req.user, workspaceId);
    return res.status(201).json({
      success: true,
      message: "Join request submitted successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getWorkspaceJoinRequests = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const result = await joinRequestService.getWorkspaceJoinRequests(workspaceId, req.user);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const resolveJoinRequest = async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const { action } = req.body;

    const result = await joinRequestService.resolveJoinRequest(requestId, req.user, action);
    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

const getMyJoinRequests = async (req, res, next) => {
  try {
    const result = await joinRequestService.getMyJoinRequests(req.user);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createJoinRequest,
  getWorkspaceJoinRequests,
  resolveJoinRequest,
  getMyJoinRequests,
};

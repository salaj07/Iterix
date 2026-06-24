const express = require("express");
const router = express.Router();
const joinRequestController = require("../controller/joinRequest.controller");
const { protect } = require("../middleware/auth.middleware");

// Submit join request
router.post("/join-requests", protect, joinRequestController.createJoinRequest);

// Get my pending join requests
router.get("/join-requests/my", protect, joinRequestController.getMyJoinRequests);

// Get workspace join requests (admin only)
router.get("/workspaces/:workspaceId/join-requests", protect, joinRequestController.getWorkspaceJoinRequests);

// Resolve join request (admin only)
router.post("/join-requests/:requestId/resolve", protect, joinRequestController.resolveJoinRequest);

module.exports = router;

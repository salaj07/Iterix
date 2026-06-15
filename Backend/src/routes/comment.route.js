const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/auth.middleware");
const commentController = require("../controller/comment.controller");
const { validate } = require("../middleware/validate.middleware");
const { addCommentRules, taskIdParamRules } = require("../validators/comment.validator");

router.post("/", protect, addCommentRules, validate, commentController.addComment);

router.get("/task/:taskId", protect, taskIdParamRules, validate, commentController.getComments);

module.exports = router;
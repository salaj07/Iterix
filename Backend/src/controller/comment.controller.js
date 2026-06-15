const commentService = require("../services/comment.service");

const addComment = async (req, res, next) => {
  try {
    const comment = await commentService.addComment(req.body, req.user);

    res.status(201).json({
      success: true,
      message: "Comment added successfully",
      data: comment,
    });
  } catch (error) {
    next(error);
  }
};

const getComments = async (req, res, next) => {
  try {
    const comments = await commentService.getComments(
      req.params.taskId,
      req.user
    );

    res.status(200).json({
      success: true,
      data: comments,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addComment,
  getComments,
};
const sprintService = require("../services/sprint.service");

/**
 * Create Sprint
 */
const createSprint = async (req, res, next) => {
  try {
    const sprint = await sprintService.createSprint(req.body, req.user);

    return res.status(201).json({
      success: true,
      message: "Sprint created successfully",
      data: sprint,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Project Sprints
 */
const getProjectSprints = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const sprints = await sprintService.getProjectSprints(
      projectId,
      req.user
    );

    return res.status(200).json({
      success: true,
      data: sprints,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Start Sprint
 */
const startSprint = async (req, res, next) => {
  try {
    const { sprintId } = req.params;

    const sprint = await sprintService.startSprint(
      sprintId,
      req.user
    );

    return res.status(200).json({
      success: true,
      message: "Sprint started successfully",
      data: sprint,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Complete Sprint
 */
const completeSprint = async (req, res, next) => {
  try {
    const { sprintId } = req.params;

    const sprint = await sprintService.completeSprint(
      sprintId,
      req.user
    );

    return res.status(200).json({
      success: true,
      message: "Sprint completed successfully",
      data: sprint,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSprint,
  getProjectSprints,
  startSprint,
  completeSprint,
};
const projectService = require("../services/project.service");

/**
 * Create Project
 */
const createProject = async (req, res, next) => {
  try {
    const project = await projectService.createProject(req.body, req.user);

    return res.status(201).json({
      success: true,
      message: "Project created successfully",
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get All Projects for Logged-in User
 */
const getUserProjects = async (req, res, next) => {
  try {
    const projects = await projectService.getUserProjects(req.user);

    return res.status(200).json({
      success: true,
      data: projects,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Project By ID
 */
const getProjectById = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const project = await projectService.getProjectById(
      projectId,
      req.user
    );

    return res.status(200).json({
      success: true,
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Archive Project
 */
const archiveProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const project = await projectService.archiveProject(
      projectId,
      req.user
    );

    return res.status(200).json({
      success: true,
      message: "Project archived successfully",
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Project Members
 */
const getProjectMembers = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const members = await projectService.getProjectMembers(
      projectId,
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

const getProjectDashboard = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const dashboard = await projectService.getProjectDashboard(
      projectId,
      req.user
    );

    return res.status(200).json({
      success: true,
      data: dashboard,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProject,
  getUserProjects,
  getProjectById,
  archiveProject,
  getProjectMembers,
  getProjectDashboard,
  archiveProject,
  getProjectMembers,
};

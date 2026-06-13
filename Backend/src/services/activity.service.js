const Activity = require("../models/activity.model");

const logActivity = async ({
  project,
  task = null,
  user,
  action,
  details = {},
}) => {
  await Activity.create({
    project,
    task,
    user,
    action,
    details,
  });
};

module.exports = {
  logActivity,
};
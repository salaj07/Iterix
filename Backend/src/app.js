const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const { accessLogStream, logger } = require("./utils/logger");

const authRoutes = require("./routes/auth.route.js");
const workspaceRoutes = require("./routes/workspace.route");
const invitationRoutes = require("./routes/invitation.route");
const projectRoutes = require("./routes/project.routes.js");
const sprintRoutes = require("./routes/sprint.route.js");
const taskRoutes = require("./routes/task.route.js");
const commentRoutes = require("./routes/comment.route.js");
const notificationRoutes = require("./routes/notification.route.js");

const app = express();

/* ===========================
   Security
=========================== */
app.use(helmet());

/* ===========================
   HTTP Request Logging (Morgan)
=========================== */
// Write combined logs to rotating access.log file
app.use(morgan("combined", { stream: accessLogStream }));

// Also print colored `dev` format to stdout during development
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

/* ===========================
   CORS
=========================== */
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

/* ===========================
   Body Parsing
=========================== */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/* ===========================
   Routes
=========================== */
app.use("/api/auth", authRoutes);
app.use("/api/workspaces", workspaceRoutes);
app.use("/api", invitationRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/sprints", sprintRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/notifications", notificationRoutes);

/* ===========================
   Health Check
=========================== */
app.get("/api/health", (_req, res) => {
  res.status(200).json({ success: true, message: "Server is healthy" });
});

/* ===========================
   Global Error Handler
=========================== */
app.use((err, req, res, next) => {
  logger.error(err.message || "Unhandled error", err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

module.exports = app;
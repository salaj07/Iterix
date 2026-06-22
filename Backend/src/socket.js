const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("./models/user.model");

let io = null;

const initIO = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "*",
      methods: ["GET", "POST", "PATCH", "DELETE"],
      credentials: true,
    },
  });

  // Socket middleware for authentication
  io.use(async (socket, next) => {
    try {
      let token = socket.handshake.auth?.token;

      // Fallback: parse from cookie
      if (!token && socket.handshake.headers.cookie) {
        const cookies = socket.handshake.headers.cookie.split(";").reduce((acc, c) => {
          const parts = c.trim().split("=");
          if (parts.length >= 2) {
            const key = parts[0];
            const value = parts.slice(1).join("=");
            acc[key] = value;
          }
          return acc;
        }, {});
        token = cookies.token;
      }

      if (!token) {
        return next(new Error("Authentication error: No token found"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
      const user = await User.findById(decoded.userId);
      if (!user) {
        return next(new Error("Authentication error: User not found"));
      }

      socket.user = user;
      next();
    } catch (err) {
      next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`🔌 Client connected: ${socket.user.name} (${socket.id})`);

    // Join room for this user's private updates (e.g. notifications)
    socket.join(`user:${socket.user._id.toString()}`);

    // Listen for room join requests
    socket.on("join_project", (projectId) => {
      if (projectId) {
        socket.join(`project:${projectId}`);
        console.log(`📁 User ${socket.user.name} joined project room: project:${projectId}`);
      }
    });

    socket.on("leave_project", (projectId) => {
      if (projectId) {
        socket.leave(`project:${projectId}`);
        console.log(`📁 User ${socket.user.name} left project room: project:${projectId}`);
      }
    });

    socket.on("disconnect", () => {
      console.log(`🔌 Client disconnected: ${socket.user.name} (${socket.id})`);
    });
  });

  return io;
};

const getIO = () => {
  return io; // returns null if not initialized yet (safe for helper calls)
};

const emitProjectEvent = (projectId, eventName, data) => {
  if (io && projectId) {
    io.to(`project:${projectId.toString()}`).emit(eventName, data);
  }
};

module.exports = {
  initIO,
  getIO,
  emitProjectEvent,
};

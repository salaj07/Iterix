require("dotenv").config();

// Verify critical environment variables before loading any server code
const REQUIRED_ENV = [
  "MONGODB_URI",
  "JWT_SECRET",
  "EMAIL_HOST",
  "EMAIL_PORT",
  "EMAIL_USER",
  "EMAIL_PASS",
  "EMAIL_FROM",
  "GOOGLE_CLIENT_ID"
];
for (const env of REQUIRED_ENV) {
  if (!process.env[env]) {
    console.error(`❌ Critical Error: Environment variable ${env} is missing.`);
    process.exit(1);
  }
}

const app = require("./src/app");
const connectDB = require("./src/db/db");
const mongoose = require("mongoose");

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await connectDB();

    const server = app.listen(PORT, () => {
      console.log(`🚀 Server is running on PORT: ${PORT}`);
    });

    // Initialize Socket.io
    const { initIO } = require("./src/socket");
    initIO(server);

    // Graceful shutdown handler
    const gracefulShutdown = (signal) => {
      console.log(`\n⚙️ Received ${signal}. Starting graceful shutdown...`);

      // Close Socket.io server and all active connections
      try {
        const { getIO } = require("./src/socket");
        const io = getIO();
        if (io) {
          console.log("🔌 Closing Socket.io server and active connections...");
          io.close();
        }
      } catch (err) {
        console.error("⚠️ Error closing Socket.io server:", err.message);
      }

      server.close(async () => {
        console.log("🔒 Closed remaining active HTTP connections.");
        try {
          await mongoose.connection.close();
          console.log("💾 Database connection closed successfully.");
          process.exit(0);
        } catch (err) {
          console.error("❌ Error closing database connection:", err.message);
          process.exit(1);
        }
      });

      // Force close connections after 10 seconds if shutdown hangs
      setTimeout(() => {
        console.error("⚠️ Forcefully shutting down after timeout.");
        process.exit(1);
      }, 10000);
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));

  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
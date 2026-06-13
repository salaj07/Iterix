const fs = require("fs");
const path = require("path");
const rfs = require("rotating-file-stream");

// Ensure logs/ directory exists
const logsDir = path.join(__dirname, "..", "..", "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/* ─── Rotating file streams ──────────────────────────────────────────────── */

/**
 * Access log — all HTTP requests (morgan combined format)
 * Rotates daily, keeps last 14 days
 */
const accessLogStream = rfs.createStream("access.log", {
  interval: "1d",
  path: logsDir,
  maxFiles: 14,
});

/**
 * Error log — written manually for caught server errors
 * Rotates daily, keeps last 30 days
 */
const errorLogStream = rfs.createStream("error.log", {
  interval: "1d",
  path: logsDir,
  maxFiles: 30,
});

/* ─── Simple logger utility ──────────────────────────────────────────────── */

const timestamp = () => new Date().toISOString();

const logger = {
  /**
   * @param {string} message
   * @param {object} [meta]
   */
  info(message, meta = {}) {
    const entry = JSON.stringify({ level: "INFO", time: timestamp(), message, ...meta });
    console.log(entry);
  },

  /**
   * @param {string} message
   * @param {Error|object} [error]
   */
  error(message, error = {}) {
    const entry = JSON.stringify({
      level: "ERROR",
      time: timestamp(),
      message,
      error: error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : error,
    });
    console.error(entry);
    errorLogStream.write(entry + "\n");
  },

  /**
   * @param {string} message
   * @param {object} [meta]
   */
  warn(message, meta = {}) {
    const entry = JSON.stringify({ level: "WARN", time: timestamp(), message, ...meta });
    console.warn(entry);
  },
};

module.exports = { accessLogStream, logger };

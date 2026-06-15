/**
 * Jest Global Setup — runs ONCE before all tests
 * Connects to a dedicated test database so tests never touch your dev data.
 */

const mongoose = require("mongoose");
require("dotenv").config();

module.exports = async () => {
  const testDbUri =
    process.env.MONGODB_TEST_URI ||
    process.env.MONGODB_URI.replace(/\/([^/]+)$/, "/Iterix_test");

  await mongoose.connect(testDbUri);
  global.__MONGO_URI__ = testDbUri;

  console.log(`\n🧪 Connected to test DB: ${testDbUri}`);
};

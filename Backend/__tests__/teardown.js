/**
 * Jest Global Teardown — runs ONCE after all tests
 * Drops the test database and closes the connection.
 */

const mongoose = require("mongoose");

module.exports = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  console.log("\n✅ Test DB dropped and connection closed.");
};

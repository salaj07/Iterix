/**
 * Jest Global Setup — runs ONCE before all tests
 * Connects to a dedicated test database so tests never touch your dev data.
 */

const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
require("dotenv").config();

module.exports = async () => {
  const mongoServer = await MongoMemoryServer.create();
  const testDbUri = mongoServer.getUri();

  process.env.MONGODB_TEST_URI = testDbUri;

  await mongoose.connect(testDbUri);
  global.__MONGO_URI__ = testDbUri;
  global.__MONGOD__ = mongoServer;

  console.log(`\n🧪 Connected to in-memory test DB: ${testDbUri}`);
};

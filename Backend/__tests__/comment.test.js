/**
 * Comment API Tests
 *
 * Tests for:
 *  POST /api/comments
 *  GET  /api/comments/task/:taskId
 */

require("dotenv").config();
const mongoose = require("mongoose");
const request = require("supertest");
const app = require("../src/app");

const TEST_DB_URI =
  process.env.MONGODB_TEST_URI ||
  process.env.MONGODB_URI.replace(/\/([^/]+)$/, "/Iterix_test");

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(TEST_DB_URI);
  }
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
});

const FAKE_TASK_ID = new mongoose.Types.ObjectId().toString();

/* ─── POST /api/comments ─────────────────────────────────────────────── */
describe("POST /api/comments", () => {
  it("should return 401 when not authenticated", async () => {
    const res = await request(app)
      .post("/api/comments")
      .send({ content: "Great work!", taskId: FAKE_TASK_ID });
    expect(res.statusCode).toBe(401);
  });

  it("should return 401 or 422 when content is missing", async () => {
    const res = await request(app)
      .post("/api/comments")
      .send({ taskId: FAKE_TASK_ID });
    expect([401, 422]).toContain(res.statusCode);
  });

  it("should return 401 or 422 when taskId is missing", async () => {
    const res = await request(app)
      .post("/api/comments")
      .send({ content: "Hello" });
    expect([401, 422]).toContain(res.statusCode);
  });

  it("should return 401 or 422 when taskId is not a valid MongoId", async () => {
    const res = await request(app)
      .post("/api/comments")
      .send({ content: "Hello", taskId: "bad-id" });
    expect([401, 422]).toContain(res.statusCode);
  });
});

/* ─── GET /api/comments/task/:taskId ────────────────────────────────── */
describe("GET /api/comments/task/:taskId", () => {
  it("should return 401 when not authenticated", async () => {
    const res = await request(app).get(`/api/comments/task/${FAKE_TASK_ID}`);
    expect(res.statusCode).toBe(401);
  });

  it("should return 401 or 422 when taskId is invalid MongoId", async () => {
    const res = await request(app).get("/api/comments/task/invalid");
    expect([401, 422]).toContain(res.statusCode);
  });
});

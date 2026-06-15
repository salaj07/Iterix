/**
 * Task API Tests
 *
 * Tests for:
 *  POST   /api/tasks
 *  GET    /api/tasks/project/:projectId
 *  PATCH  /api/tasks/:taskId/status
 *  PATCH  /api/tasks/:taskId/assign
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
const FAKE_PROJECT_ID = new mongoose.Types.ObjectId().toString();
const FAKE_USER_ID = new mongoose.Types.ObjectId().toString();

/* ─── POST /api/tasks ────────────────────────────────────────────────── */
describe("POST /api/tasks", () => {
  it("should return 401 when not authenticated", async () => {
    const res = await request(app)
      .post("/api/tasks")
      .send({ title: "Fix bug", projectId: FAKE_PROJECT_ID });
    expect(res.statusCode).toBe(401);
  });

  it("should return 401 or 422 when title is missing", async () => {
    const res = await request(app).post("/api/tasks").send({ projectId: FAKE_PROJECT_ID });
    expect([401, 422]).toContain(res.statusCode);
  });

  it("should return 401 or 422 when status is invalid", async () => {
    const res = await request(app).post("/api/tasks").send({
      title: "Fix bug",
      projectId: FAKE_PROJECT_ID,
      status: "INVALID_STATUS",
    });
    expect([401, 422]).toContain(res.statusCode);
  });
});

/* ─── GET /api/tasks/project/:projectId ──────────────────────────────── */
describe("GET /api/tasks/project/:projectId", () => {
  it("should return 401 when not authenticated", async () => {
    const res = await request(app).get(`/api/tasks/project/${FAKE_PROJECT_ID}`);
    expect(res.statusCode).toBe(401);
  });
});

/* ─── PATCH /api/tasks/:taskId/status ───────────────────────────────── */
describe("PATCH /api/tasks/:taskId/status", () => {
  it("should return 401 when not authenticated", async () => {
    const res = await request(app)
      .patch(`/api/tasks/${FAKE_TASK_ID}/status`)
      .send({ status: "Done" });
    expect(res.statusCode).toBe(401);
  });

  it("should return 401 or 422 when status value is invalid", async () => {
    const res = await request(app)
      .patch(`/api/tasks/${FAKE_TASK_ID}/status`)
      .send({ status: "BadStatus" });
    expect([401, 422]).toContain(res.statusCode);
  });

  it("should return 422 or 401 when taskId is not a MongoId", async () => {
    const res = await request(app)
      .patch("/api/tasks/not-mongo/status")
      .send({ status: "Done" });
    expect([401, 422]).toContain(res.statusCode);
  });
});

/* ─── PATCH /api/tasks/:taskId/assign ───────────────────────────────── */
describe("PATCH /api/tasks/:taskId/assign", () => {
  it("should return 401 when not authenticated", async () => {
    const res = await request(app)
      .patch(`/api/tasks/${FAKE_TASK_ID}/assign`)
      .send({ assigneeId: FAKE_USER_ID });
    expect(res.statusCode).toBe(401);
  });

  it("should return 401 or 422 when assigneeId is missing", async () => {
    const res = await request(app)
      .patch(`/api/tasks/${FAKE_TASK_ID}/assign`)
      .send({});
    expect([401, 422]).toContain(res.statusCode);
  });
});

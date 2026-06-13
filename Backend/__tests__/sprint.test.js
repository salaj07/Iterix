/**
 * Sprint API Tests
 *
 * Tests for:
 *  POST  /api/sprints
 *  GET   /api/sprints/project/:projectId
 *  PATCH /api/sprints/:sprintId/start
 *  PATCH /api/sprints/:sprintId/complete
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

const FAKE_SPRINT_ID = new mongoose.Types.ObjectId().toString();
const FAKE_PROJECT_ID = new mongoose.Types.ObjectId().toString();

/* ─── POST /api/sprints ──────────────────────────────────────────────── */
describe("POST /api/sprints", () => {
  it("should return 401 when not authenticated", async () => {
    const res = await request(app).post("/api/sprints").send({
      name: "Sprint 1",
      projectId: FAKE_PROJECT_ID,
      startDate: "2025-01-01",
      endDate: "2025-01-14",
    });
    expect(res.statusCode).toBe(401);
  });

  it("should return 422 or 401 when required fields are missing", async () => {
    const res = await request(app).post("/api/sprints").send({});
    expect([401, 422]).toContain(res.statusCode);
  });

  it("should return 422 or 401 when endDate is before startDate", async () => {
    const res = await request(app).post("/api/sprints").send({
      name: "Sprint 1",
      projectId: FAKE_PROJECT_ID,
      startDate: "2025-01-14",
      endDate: "2025-01-01",
    });
    expect([401, 422]).toContain(res.statusCode);
  });
});

/* ─── GET /api/sprints/project/:projectId ────────────────────────────── */
describe("GET /api/sprints/project/:projectId", () => {
  it("should return 401 when not authenticated", async () => {
    const res = await request(app).get(`/api/sprints/project/${FAKE_PROJECT_ID}`);
    expect(res.statusCode).toBe(401);
  });
});

/* ─── PATCH /api/sprints/:sprintId/start ────────────────────────────── */
describe("PATCH /api/sprints/:sprintId/start", () => {
  it("should return 401 when not authenticated", async () => {
    const res = await request(app).patch(`/api/sprints/${FAKE_SPRINT_ID}/start`);
    expect(res.statusCode).toBe(401);
  });

  it("should return 422 or 401 when sprintId is not a MongoId", async () => {
    const res = await request(app).patch("/api/sprints/invalid-id/start");
    expect([401, 422]).toContain(res.statusCode);
  });
});

/* ─── PATCH /api/sprints/:sprintId/complete ─────────────────────────── */
describe("PATCH /api/sprints/:sprintId/complete", () => {
  it("should return 401 when not authenticated", async () => {
    const res = await request(app).patch(`/api/sprints/${FAKE_SPRINT_ID}/complete`);
    expect(res.statusCode).toBe(401);
  });
});

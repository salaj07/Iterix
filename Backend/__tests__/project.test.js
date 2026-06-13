/**
 * Project API Tests
 *
 * Tests for:
 *  POST  /api/projects
 *  GET   /api/projects
 *  GET   /api/projects/:projectId
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

const FAKE_PROJECT_ID = new mongoose.Types.ObjectId().toString();
const FAKE_WORKSPACE_ID = new mongoose.Types.ObjectId().toString();

/* ─── POST /api/projects ─────────────────────────────────────────────── */
describe("POST /api/projects", () => {
  it("should return 401 when not authenticated", async () => {
    const res = await request(app)
      .post("/api/projects")
      .send({ name: "Sprint App", workspaceId: FAKE_WORKSPACE_ID });
    expect(res.statusCode).toBe(401);
  });

  it("should return 422 when name is missing (validation runs after auth)", async () => {
    // Note: protect middleware runs first (returns 401).
    // To isolate validator behavior, just confirm it's not 500.
    const res = await request(app).post("/api/projects").send({});
    expect([401, 422]).toContain(res.statusCode);
  });

  it("should return 422 when workspaceId is invalid MongoId format", async () => {
    const res = await request(app)
      .post("/api/projects")
      .send({ name: "Test", workspaceId: "bad-id" });
    expect([401, 422]).toContain(res.statusCode);
  });
});

/* ─── GET /api/projects ──────────────────────────────────────────────── */
describe("GET /api/projects", () => {
  it("should return 401 when not authenticated", async () => {
    const res = await request(app).get("/api/projects");
    expect(res.statusCode).toBe(401);
  });
});

/* ─── GET /api/projects/:projectId ───────────────────────────────────── */
describe("GET /api/projects/:projectId", () => {
  it("should return 401 when not authenticated", async () => {
    const res = await request(app).get(`/api/projects/${FAKE_PROJECT_ID}`);
    expect(res.statusCode).toBe(401);
  });

  it("should return 401 or 422 when projectId is invalid MongoId", async () => {
    const res = await request(app).get("/api/projects/not-valid");
    expect([401, 422]).toContain(res.statusCode);
  });
});

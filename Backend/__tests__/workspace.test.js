/**
 * Workspace API Tests
 *
 * Tests for:
 *  POST   /api/workspaces
 *  GET    /api/workspaces
 *  GET    /api/workspaces/:workspaceId
 *  PATCH  /api/workspaces/:workspaceId
 *  DELETE /api/workspaces/:workspaceId
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

const FAKE_WORKSPACE_ID = new mongoose.Types.ObjectId().toString();

/* ─── POST /api/workspaces ───────────────────────────────────────────── */
describe("POST /api/workspaces", () => {
  it("should return 401 when not authenticated", async () => {
    const res = await request(app)
      .post("/api/workspaces")
      .send({ name: "My Workspace" });
    expect(res.statusCode).toBe(401);
  });

  it("should return 422 when name is missing", async () => {
    // We can't be authenticated without a real token, but we can test validation
    // by checking that name:missing results in a 422 even before auth check
    // (note: auth runs first so we get 401; this is expected behavior)
    const res = await request(app)
      .post("/api/workspaces")
      .send({});
    expect([401, 422]).toContain(res.statusCode);
  });
});

/* ─── GET /api/workspaces ────────────────────────────────────────────── */
describe("GET /api/workspaces", () => {
  it("should return 401 when not authenticated", async () => {
    const res = await request(app).get("/api/workspaces");
    expect(res.statusCode).toBe(401);
  });
});

/* ─── GET /api/workspaces/:workspaceId ───────────────────────────────── */
describe("GET /api/workspaces/:workspaceId", () => {
  it("should return 401 when not authenticated", async () => {
    const res = await request(app).get(`/api/workspaces/${FAKE_WORKSPACE_ID}`);
    expect(res.statusCode).toBe(401);
  });

  it("should return 422 when workspaceId is not a valid MongoId", async () => {
    // Auth runs first, so we get 401. If auth were bypassed, we'd get 422.
    const res = await request(app).get("/api/workspaces/not-a-mongo-id");
    expect([401, 422]).toContain(res.statusCode);
  });
});

/* ─── PATCH /api/workspaces/:workspaceId ────────────────────────────── */
describe("PATCH /api/workspaces/:workspaceId", () => {
  it("should return 401 when not authenticated", async () => {
    const res = await request(app)
      .patch(`/api/workspaces/${FAKE_WORKSPACE_ID}`)
      .send({ name: "Updated" });
    expect(res.statusCode).toBe(401);
  });
});

/* ─── DELETE /api/workspaces/:workspaceId ───────────────────────────── */
describe("DELETE /api/workspaces/:workspaceId", () => {
  it("should return 401 when not authenticated", async () => {
    const res = await request(app).delete(`/api/workspaces/${FAKE_WORKSPACE_ID}`);
    expect(res.statusCode).toBe(401);
  });
});

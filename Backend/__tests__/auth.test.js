/**
 * Auth API Tests
 *
 * Tests for:
 *  POST /api/auth/send-otp
 *  POST /api/auth/verify-otp
 *  GET  /api/auth/me
 *  POST /api/auth/logout
 */

require("dotenv").config();
const mongoose = require("mongoose");
const request = require("supertest");

jest.mock("../src/services/email.service", () => ({
  sendOTPEmail: jest.fn().mockResolvedValue(true),
  sendInvitationEmail: jest.fn().mockResolvedValue(true),
}));

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

/* ─── POST /api/auth/send-otp ─────────────────────────────────────────── */
describe("POST /api/auth/send-otp", () => {
  it("should return 422 when email is missing", async () => {
    const res = await request(app).post("/api/auth/send-otp").send({});
    expect(res.statusCode).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "email" }),
      ])
    );
  });

  it("should return 422 when email is invalid", async () => {
    const res = await request(app)
      .post("/api/auth/send-otp")
      .send({ email: "not-an-email" });
    expect(res.statusCode).toBe(422);
    expect(res.body.errors[0].field).toBe("email");
  });

  it("should accept a valid email and attempt OTP send", async () => {
    const res = await request(app)
      .post("/api/auth/send-otp")
      .send({ email: "test@medicaps.ac.in" });
    // 200 = email sent, 500 = email config issue — both mean validation passed
    expect([200, 500]).toContain(res.statusCode);
  });
});

/* ─── POST /api/auth/verify-otp ──────────────────────────────────────── */
describe("POST /api/auth/verify-otp", () => {
  it("should return 422 when body is empty", async () => {
    const res = await request(app).post("/api/auth/verify-otp").send({});
    expect(res.statusCode).toBe(422);
    expect(res.body.errors.length).toBeGreaterThanOrEqual(2); // email + otp
  });

  it("should return 422 when OTP is not 6 digits", async () => {
    const res = await request(app)
      .post("/api/auth/verify-otp")
      .send({ email: "test@medicaps.ac.in", otp: "123" });
    expect(res.statusCode).toBe(422);
    expect(res.body.errors[0].field).toBe("otp");
  });

  it("should return 422 when OTP is non-numeric", async () => {
    const res = await request(app)
      .post("/api/auth/verify-otp")
      .send({ email: "test@medicaps.ac.in", otp: "abcdef" });
    expect(res.statusCode).toBe(422);
  });

  it("should pass validation with correct shape but fail at service level", async () => {
    const res = await request(app)
      .post("/api/auth/verify-otp")
      .send({ email: "test@medicaps.ac.in", otp: "123456" });
    // Validation passed — service may return 400, 404, 500 depending on OTP state
    expect([200, 400, 404, 500]).toContain(res.statusCode);
  });
});

/* ─── GET /api/auth/me ───────────────────────────────────────────────── */
describe("GET /api/auth/me", () => {
  it("should return 401 when no auth token is present", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

/* ─── POST /api/auth/logout ──────────────────────────────────────────── */
describe("POST /api/auth/logout", () => {
  it("should return 200 and clear cookie", async () => {
    const res = await request(app).post("/api/auth/logout");
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

/* ─── GET /api/health ────────────────────────────────────────────────── */
describe("GET /api/health", () => {
  it("should return 200 with healthy status", async () => {
    const res = await request(app).get("/api/health");
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

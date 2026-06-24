/**
 * Join Request API Tests
 *
 * Tests for:
 *  POST   /api/join-requests
 *  GET    /api/workspaces/:workspaceId/join-requests
 *  POST   /api/join-requests/:requestId/resolve
 */

require("dotenv").config();
const mongoose = require("mongoose");
const request = require("supertest");
const jwt = require("jsonwebtoken");

jest.mock("../src/services/email.service", () => ({
  sendOTPEmail: jest.fn().mockResolvedValue(true),
  sendInvitationEmail: jest.fn().mockResolvedValue(true),
}));

const app = require("../src/app");
const User = require("../src/models/user.model");
const Workspace = require("../src/models/Workspace.model");
const WorkspaceMember = require("../src/models/workspaceMember.model");
const JoinRequest = require("../src/models/joinRequest.model");

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

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || "aee89ad690d5a08fe1170290dde4c64f", {
    algorithm: "HS256",
  });
};

describe("Join Request API", () => {
  let adminUser;
  let nonAdminUser;
  let strangerUser;
  let workspace;
  let adminToken;
  let nonAdminToken;
  let strangerToken;

  beforeEach(async () => {
    // Clear collections
    await User.deleteMany({});
    await Workspace.deleteMany({});
    await WorkspaceMember.deleteMany({});
    await JoinRequest.deleteMany({});

    // Create users
    adminUser = await User.create({
      name: "Admin User",
      email: "admin@medicaps.ac.in",
      provider: "email",
    });

    nonAdminUser = await User.create({
      name: "Non-Admin User",
      email: "developer@medicaps.ac.in",
      provider: "email",
    });

    strangerUser = await User.create({
      name: "Stranger User",
      email: "stranger@medicaps.ac.in",
      provider: "email",
    });

    adminToken = generateToken(adminUser._id);
    nonAdminToken = generateToken(nonAdminUser._id);
    strangerToken = generateToken(strangerUser._id);

    // Create workspace
    workspace = await Workspace.create({
      name: "Test Workspace",
      owner: adminUser._id,
    });

    // Create memberships
    await WorkspaceMember.create({
      workspace: workspace._id,
      user: adminUser._id,
      role: "ADMIN",
      isActive: true,
    });

    await WorkspaceMember.create({
      workspace: workspace._id,
      user: nonAdminUser._id,
      role: "DEVELOPER",
      isActive: true,
    });
  });

  describe("POST /api/join-requests", () => {
    it("should return 401 when not authenticated", async () => {
      const res = await request(app)
        .post("/api/join-requests")
        .send({ workspaceId: workspace._id });
      expect(res.statusCode).toBe(401);
    });

    it("should return 400 when workspaceId is missing", async () => {
      const res = await request(app)
        .post("/api/join-requests")
        .set("Cookie", [`token=${strangerToken}`])
        .send({});
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain("Workspace ID is required");
    });

    it("should submit join request successfully", async () => {
      const res = await request(app)
        .post("/api/join-requests")
        .set("Cookie", [`token=${strangerToken}`])
        .send({ workspaceId: workspace._id });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain("Join request submitted successfully");
      expect(res.body.data.email).toBe(strangerUser.email);
      expect(res.body.data.status).toBe("PENDING");
    });

    it("should fail when user is already a member", async () => {
      const res = await request(app)
        .post("/api/join-requests")
        .set("Cookie", [`token=${nonAdminToken}`])
        .send({ workspaceId: workspace._id });

      expect(res.statusCode).toBe(500);
      expect(res.body.message).toContain("You are already a member of this workspace");
    });

    it("should fail when a pending request already exists (anti-spam check)", async () => {
      // Create first request
      await request(app)
        .post("/api/join-requests")
        .set("Cookie", [`token=${strangerToken}`])
        .send({ workspaceId: workspace._id });

      // Try sending again
      const res = await request(app)
        .post("/api/join-requests")
        .set("Cookie", [`token=${strangerToken}`])
        .send({ workspaceId: workspace._id });

      expect(res.statusCode).toBe(500);
      expect(res.body.message).toContain("A pending request already exists");
    });
  });

  describe("GET /api/join-requests/my", () => {
    it("should return pending requests of current user", async () => {
      await JoinRequest.create({
        workspace: workspace._id,
        user: strangerUser._id,
        email: strangerUser.email,
        status: "PENDING",
      });

      const res = await request(app)
        .get("/api/join-requests/my")
        .set("Cookie", [`token=${strangerToken}`]);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].workspace._id).toBe(workspace._id.toString());
    });
  });

  describe("GET /api/workspaces/:workspaceId/join-requests", () => {
    beforeEach(async () => {
      // Create a pending request
      await JoinRequest.create({
        workspace: workspace._id,
        user: strangerUser._id,
        email: strangerUser.email,
        status: "PENDING",
      });
    });

    it("should return 401 when not authenticated", async () => {
      const res = await request(app)
        .get(`/api/workspaces/${workspace._id}/join-requests`);
      expect(res.statusCode).toBe(401);
    });

    it("should fail if user is not workspace admin", async () => {
      const res = await request(app)
        .get(`/api/workspaces/${workspace._id}/join-requests`)
        .set("Cookie", [`token=${nonAdminToken}`]);
      expect(res.statusCode).toBe(500);
      expect(res.body.message).toContain("Only workspace admins can view join requests");
    });

    it("should return workspace join requests for admins", async () => {
      const res = await request(app)
        .get(`/api/workspaces/${workspace._id}/join-requests`)
        .set("Cookie", [`token=${adminToken}`]);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].email).toBe(strangerUser.email);
    });
  });

  describe("POST /api/join-requests/:requestId/resolve", () => {
    let joinRequest;

    beforeEach(async () => {
      joinRequest = await JoinRequest.create({
        workspace: workspace._id,
        user: strangerUser._id,
        email: strangerUser.email,
        status: "PENDING",
      });
    });

    it("should fail to resolve if user is not admin", async () => {
      const res = await request(app)
        .post(`/api/join-requests/${joinRequest._id}/resolve`)
        .set("Cookie", [`token=${nonAdminToken}`])
        .send({ action: "ACCEPT" });

      expect(res.statusCode).toBe(500);
      expect(res.body.message).toContain("Only workspace admins can resolve join requests");
    });

    it("should accept join request and promote to DEVELOPER", async () => {
      const res = await request(app)
        .post(`/api/join-requests/${joinRequest._id}/resolve`)
        .set("Cookie", [`token=${adminToken}`])
        .send({ action: "ACCEPT" });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain("accepted successfully");

      const dbRequest = await JoinRequest.findById(joinRequest._id);
      expect(dbRequest.status).toBe("ACCEPTED");

      const member = await WorkspaceMember.findOne({
        workspace: workspace._id,
        user: strangerUser._id,
      });
      expect(member).toBeDefined();
      expect(member.isActive).toBe(true);
      expect(member.role).toBe("DEVELOPER");
    });

    it("should reject join request", async () => {
      const res = await request(app)
        .post(`/api/join-requests/${joinRequest._id}/resolve`)
        .set("Cookie", [`token=${adminToken}`])
        .send({ action: "REJECT" });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain("rejected successfully");

      const dbRequest = await JoinRequest.findById(joinRequest._id);
      expect(dbRequest.status).toBe("REJECTED");

      const member = await WorkspaceMember.findOne({
        workspace: workspace._id,
        user: strangerUser._id,
      });
      expect(member).toBeNull();
    });
  });
});

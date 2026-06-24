/**
 * Invitation API Tests
 *
 * Tests for:
 *  DELETE /api/invitations/:invitationId/cancel
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
const Invitation = require("../src/models/invitation.model");

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

describe("DELETE /api/invitations/:invitationId/cancel", () => {
  let adminUser;
  let nonAdminUser;
  let workspace;
  let invitation;
  let adminToken;
  let nonAdminToken;

  beforeEach(async () => {
    // Clear collections
    await User.deleteMany({});
    await Workspace.deleteMany({});
    await WorkspaceMember.deleteMany({});
    await Invitation.deleteMany({});

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

    adminToken = generateToken(adminUser._id);
    nonAdminToken = generateToken(nonAdminUser._id);

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

    // Create invitation
    invitation = await Invitation.create({
      workspace: workspace._id,
      email: "invitee@medicaps.ac.in",
      invitedBy: adminUser._id,
      role: "DEVELOPER",
      status: "PENDING",
    });
  });

  it("should return 401 when not authenticated", async () => {
    const res = await request(app)
      .delete(`/api/invitations/${invitation._id}/cancel`);
    expect(res.statusCode).toBe(401);
  });

  it("should return 422 when invitationId is invalid format", async () => {
    const res = await request(app)
      .delete("/api/invitations/invalid-mongo-id/cancel")
      .set("Cookie", [`token=${adminToken}`]);
    expect(res.statusCode).toBe(422);
  });

  it("should return 500/404 when invitation is not found", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .delete(`/api/invitations/${fakeId}/cancel`)
      .set("Cookie", [`token=${adminToken}`]);
    expect(res.statusCode).toBe(500);
    expect(res.body.message).toContain("Invitation not found");
  });

  it("should return 500/403 when user is not workspace admin", async () => {
    const res = await request(app)
      .delete(`/api/invitations/${invitation._id}/cancel`)
      .set("Cookie", [`token=${nonAdminToken}`]);
    expect(res.statusCode).toBe(500);
    expect(res.body.message).toContain("Only workspace admins can cancel invitations");
  });

  it("should return 500 when invitation is not pending", async () => {
    invitation.status = "ACCEPTED";
    await invitation.save();

    const res = await request(app)
      .delete(`/api/invitations/${invitation._id}/cancel`)
      .set("Cookie", [`token=${adminToken}`]);
    expect(res.statusCode).toBe(500);
    expect(res.body.message).toContain("Only pending invitations can be cancelled");
  });

  it("should cancel invitation successfully when requested by admin", async () => {
    const res = await request(app)
      .delete(`/api/invitations/${invitation._id}/cancel`)
      .set("Cookie", [`token=${adminToken}`]);
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain("Invitation cancelled successfully");

    // Verify invitation is deleted in database
    const dbInvitation = await Invitation.findById(invitation._id);
    expect(dbInvitation).toBeNull();
  });
});

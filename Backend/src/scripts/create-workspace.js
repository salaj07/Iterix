// node src/scripts/create-workspace.js "your-email@medicaps.ac.in" "New Workspace Name" "Optional Description Here" 

require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });
const connectDB = require("../db/db");
const User = require("../models/user.model");
const workspaceService = require("../services/workspace.service");
const mongoose = require("mongoose");

const run = async () => {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error("Usage (from inside Backend/ ): node src/scripts/create-workspace.js <user-email> <workspace-name> [workspace-description]");
    process.exit(1);
  }

  const [email, name, description] = args;

  try {
    await connectDB();
    console.log("Connected to database...");

    let user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      console.log(`User with email "${email}" not found. Auto-creating user...`);
      user = await User.create({
        name: email.trim().split("@")[0],
        email: email.trim().toLowerCase(),
        provider: "email",
      });
      console.log(`User created: ${user.name} (${user._id})`);
    } else {
      console.log(`Found existing user: ${user.name || user.email} (${user._id})`);
    }
    
    const workspace = await workspaceService.createWorkspace(user, {
      name: name.trim(),
      description: description ? description.trim() : "",
    });

    console.log(`\n🎉 Success! Workspace created:`);
    console.log(`- Name: ${workspace.name}`);
    console.log(`- ID: ${workspace._id}`);
    console.log(`- Owner: ${user.email} (Assigned as ADMIN)`);

  } catch (error) {
    console.error("Error creating workspace:", error.message);
  } finally {
    await mongoose.connection.close();
    console.log("Database connection closed.");
  }
};

run();

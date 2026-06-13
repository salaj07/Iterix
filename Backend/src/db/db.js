const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const connection = await mongoose.connect(process.env.MONGODB_URI);
    console.log("database connected");
    
    
  } catch (error) {
   
    console.error(error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
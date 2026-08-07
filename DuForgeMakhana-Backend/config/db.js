import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config(); // Ensure this is called to load variables from .env

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not defined in environment variables.");
    }

    console.log("Connecting to MongoDB with URI:", process.env.MONGO_URI);

    const conn = await mongoose.connect(process.env.MONGO_URI);

    // Debug the connection state
    const connectionState = conn.connection.readyState;
    console.log("MongoDB connection state:", connectionState);

    if (connectionState === 1) {
      console.log("MongoDB connection is established successfully.");
    } else {
      console.log("MongoDB connection is not fully established. Check server logs.");
    }

    // Migration (email-OTP switch): the User collection used to have a unique
    // index on `phone`. With email as the identity and phone optional, that
    // legacy index rejects a 2nd account with no phone (null collision). Drop
    // it once if present so email-only signups work. Idempotent + safe.
    try {
      const indexes = await conn.connection.collection("users").indexes();
      if (indexes.some((i) => i.name === "phone_1")) {
        await conn.connection.collection("users").dropIndex("phone_1");
        console.log("🛠️  Dropped legacy unique index users.phone_1");
      }
    } catch (idxErr) {
      // Collection may not exist yet on a fresh DB — nothing to migrate.
      if (idxErr?.codeName !== "NamespaceNotFound") {
        console.warn("Index migration (phone_1) skipped:", idxErr.message);
      }
    }
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1); // Exit on failure
  }
};

export default connectDB;
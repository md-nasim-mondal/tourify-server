import { Server } from "http";
import app from "./app";
import { seedAdmin } from "./helpers/seed";
import dotenv from "dotenv";
import axios from "axios";
dotenv.config();

let server: Server;

async function main() {
  try {
    const port = Number(process.env.PORT) || 5000;

    console.log("Attempting to seed admin...");
    await seedAdmin();
    console.log("Admin seeded successfully");

    server = app.listen(port, "0.0.0.0", () => {
      console.log(`🚀 Tourify Server is running on port ${port}`);

      // Self-Ping Keep-Alive (Every 9 minutes)
      const invokeSelfPing = async () => {
        try {
          // Use SERVER_URL if available (for production), otherwise localhost (development)
          const baseUrl = process.env.SERVER_URL || `http://localhost:${port}`;
          const pingUrl = `${baseUrl}/api/v1/listings?limit=1`; // Lightweight query
          
          await axios.get(pingUrl);
          console.log(`✅ Self-ping successful: ${pingUrl}`);
        } catch (error) {
          console.error(`❌ Self-ping failed:`, error);
        }
      };

      // Initial ping after 10 seconds
      setTimeout(invokeSelfPing, 10000);

      // Periodic ping every 9 minutes (540,000 ms)
      setInterval(invokeSelfPing, 540000);

      // DO NOT BLOCK SERVER START: Seed Admin
      setImmediate(async () => {
        try {
          // Attempt seeding
          await seedAdmin();
          console.log("Admin seeded successfully");
        } catch (err) {
          console.error("Admin seeding failed:", err);
        }
      });
    });
  } catch (err) {
    console.error("Error during startup:", err);
    process.exit(1); // Exit if seeding or server start fails
  }
}

main();

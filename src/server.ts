import { Server } from "http";
import app from "./app";
import { seedAdmin } from "./helpers/seed";
import dotenv from "dotenv";
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
    });
  } catch (err) {
    console.error("Error during startup:", err);
    process.exit(1); // Exit if seeding or server start fails
  }
}

main();

import { Server } from "http";
import app from "./app";
import { seedAdmin } from "./helpers/seed";
import dotenv from "dotenv";
dotenv.config();

let server: Server;

async function main() {
  try {
    const port = Number(process.env.PORT) || 5000;

    server = app.listen(port, "0.0.0.0", () => {
      console.log(`🚀 Tourify Server is running on port ${port}`);

      // DO NOT BLOCK SERVER START
      setImmediate(async () => {
        try {
          await seedAdmin();
          console.log("Admin seeded successfully");
        } catch (err) {
          console.error("Admin seeding failed:", err);
        }
      });
    });

  } catch (err) {
    console.log("Error starting server:", err);
  }
}

main();

/* eslint-disable no-console */
import dotenv from "dotenv";
import path from "path";
import { Server } from "http";
import app from "./app";
import envVars from "./config/env";
import { seedAdmin } from "./helpers/seed";
dotenv.config({ path: path.join(process.cwd(), ".env") });

let server: Server;

async function main() {
  try {
    const port = Number(process.env.PORT) || envVars.PORT;

server = app.listen(port, () => {
  console.log(`🚀 Tourify Server is running on port ${port}`);
});


    // Optional: Seed Super Admin
    // await seedSuperAdmin();
    await seedAdmin();
  } catch (err) {
    console.log("Error starting server:", err);
  }
}

main();

// Handle Unhandled Rejection (Async code errors)
process.on("unhandledRejection", (err) => {
  console.log(`😈 Unhandled Rejection is detected, shutting down ...`, err);
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

// Handle Uncaught Exception (Sync code errors)
process.on("uncaughtException", (err) => {
  console.log(`😈 Uncaught Exception is detected, shutting down ...`, err);
  process.exit(1);
});

// SIGINT: Triggered by Ctrl+C
process.on("SIGINT", () => {
  console.log("SIGINT signal received... Server shutting down..");
  if (server) {
    server.close(() => {
      console.log("Server closed gracefully.");
      process.exit(0); // Success exit
    });
  } else {
    process.exit(0);
  }
});

// SIGTERM: Triggered by termination signal (e.g., from OS or Docker)
process.on("SIGTERM", () => {
  console.log("SIGTERM signal received... Server shutting down..");
  if (server) {
    server.close(() => {
      console.log("Server closed gracefully.");
      process.exit(0); // Success exit
    });
  } else {
    process.exit(0);
  }
});

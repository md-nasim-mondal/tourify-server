/* eslint-disable no-console */
import { Server } from "http";
import app from "./app";
import { config } from "./config";

let server: Server;

async function main() {
  try {
    server = app.listen(config.PORT, () => {
      console.log(`🚀 Tourify Server is running on port ${config.PORT}`);
    });

    // Optional: Seed Super Admin
    // await seedSuperAdmin();

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
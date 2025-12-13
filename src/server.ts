import { Server } from "http";
import app from "./app";
import { seedAdmin } from "./helpers/seed";

let server: Server;

async function main() {
  try {
    const port = Number(process.env.PORT) || 5000;

    server = app.listen(port, () => {
      console.log(`🚀 Tourify Server is running on port ${port}`);
    });

    await seedAdmin();
  } catch (err) {
    console.log("Error starting server:", err);
  }
}

main();

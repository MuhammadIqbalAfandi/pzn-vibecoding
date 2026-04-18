import { createApp } from "./app";
import { env } from "./config/env";
import { closeDatabaseConnection } from "./db/client";

const app = createApp();

app.listen({
  hostname: env.host,
  port: env.port,
});

console.log(`Server listening on http://${env.host}:${env.port} (${env.nodeEnv})`);

const shutdown = async () => {
  await closeDatabaseConnection();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

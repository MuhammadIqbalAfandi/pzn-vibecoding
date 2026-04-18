import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "../config/env";
import * as schema from "./schema";

const queryClient = postgres(env.databaseUrl, {
  max: 1,
});

export const db = drizzle(queryClient, { schema });

export async function checkDatabaseConnection() {
  await queryClient`select 1`;
}

export async function closeDatabaseConnection() {
  await queryClient.end();
}

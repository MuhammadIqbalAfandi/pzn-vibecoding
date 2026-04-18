import { eq } from "drizzle-orm";

import { createApp } from "../app";
import { closeDatabaseConnection, db } from "../db/client";
import { sessions, users } from "../db/schema";

type RequestOptions = {
  method?: string;
  headers?: HeadersInit;
  body?: unknown;
};

export function createTestApp() {
  return createApp();
}

export async function requestJson(path: string, options: RequestOptions = {}) {
  const app = createTestApp();
  const headers = new Headers(options.headers);

  if (options.body !== undefined && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  const response = await app.handle(
    new Request(`http://localhost${path}`, {
      method: options.method ?? "GET",
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    }),
  );

  const json = (await response.json()) as Record<string, unknown>;

  return { response, json };
}

export async function resetDatabase() {
  await db.delete(sessions);
  await db.delete(users);
}

export async function closeTestDatabaseConnection() {
  await closeDatabaseConnection();
}

export async function registerDefaultUser() {
  return requestJson("/api/v1/users", {
    method: "POST",
    body: {
      name: "Test User",
      email: "test@example.com",
      password: "password123",
    },
  });
}

export async function loginDefaultUser() {
  await registerDefaultUser();

  return requestJson("/api/v1/users/login", {
    method: "POST",
    body: {
      email: "test@example.com",
      password: "password123",
    },
  });
}

export async function findSessionByToken(token: string) {
  return db.query.sessions.findFirst({
    where: eq(sessions.token, token),
  });
}

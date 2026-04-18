import { eq } from "drizzle-orm";

import { createApp } from "../app";
import { closeDatabaseConnection, db } from "../db/client";
import { sessions, users } from "../db/schema";

type RequestOptions = {
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
};

// Creates a fresh app instance for each test request.
export function createTestApp() {
  return createApp();
}

// Sends an in-memory HTTP request to the app and parses the JSON response.
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

// Clears user and session data so each test starts from a known state.
export async function resetDatabase() {
  await db.delete(sessions);
  await db.delete(users);
}

// Closes the shared database connection after the test suite finishes.
export async function closeTestDatabaseConnection() {
  await closeDatabaseConnection();
}

// Registers the default user fixture used across authentication tests.
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

// Registers and logs in the default user, returning the login response.
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

// Looks up a session row by token so tests can assert persistence behavior.
export async function findSessionByToken(token: string) {
  return db.query.sessions.findFirst({
    where: eq(sessions.token, token),
  });
}

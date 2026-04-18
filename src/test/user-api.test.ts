import { afterAll, beforeEach, describe, expect, test } from "bun:test";

import {
  closeTestDatabaseConnection,
  findSessionByToken,
  loginDefaultUser,
  registerDefaultUser,
  requestJson,
  resetDatabase,
} from "./test-utils";

function expectValidationError(json: Record<string, unknown>) {
  expect(json).toEqual(
    expect.objectContaining({
      type: "validation",
      on: "body",
      message: expect.any(String),
    }),
  );
}

function expectUnauthorized(json: Record<string, unknown>) {
  expect(json).toEqual({
    error: "Unauthorized",
  });
}

describe("user api", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await resetDatabase();
    await closeTestDatabaseConnection();
  });

  describe("POST /api/v1/users", () => {
    test("should register a user with valid input", async () => {
      const { response, json } = await registerDefaultUser();

      expect(response.status).toBe(200);
      expect(json).toEqual({
        data: "ok",
      });
    });

    test("should reject duplicate email", async () => {
      await registerDefaultUser();

      const { response, json } = await requestJson("/api/v1/users", {
        method: "POST",
        body: {
          name: "Another User",
          email: "test@example.com",
          password: "password123",
        },
      });

      expect(response.status).toBe(409);
      expect(json).toEqual({
        error: "email is already taken",
      });
    });

    test("should reject invalid email format", async () => {
      const { response, json } = await requestJson("/api/v1/users", {
        method: "POST",
        body: {
          name: "Test User",
          email: "not-an-email",
          password: "password123",
        },
      });

      expect(response.status).toBe(422);
      expectValidationError(json);
    });

    test("should reject short password", async () => {
      const { response, json } = await requestJson("/api/v1/users", {
        method: "POST",
        body: {
          name: "Test User",
          email: "test@example.com",
          password: "short",
        },
      });

      expect(response.status).toBe(422);
      expectValidationError(json);
    });

    test("should reject empty name", async () => {
      const { response, json } = await requestJson("/api/v1/users", {
        method: "POST",
        body: {
          name: "",
          email: "test@example.com",
          password: "password123",
        },
      });

      expect(response.status).toBe(422);
      expectValidationError(json);
    });
  });

  describe("POST /api/v1/users/login", () => {
    test("should login with valid credentials and create a session", async () => {
      await registerDefaultUser();

      const { response, json } = await requestJson("/api/v1/users/login", {
        method: "POST",
        body: {
          email: "test@example.com",
          password: "password123",
        },
      });

      expect(response.status).toBe(200);
      expect(json).toEqual({
        token: expect.any(String),
      });

      const session = await findSessionByToken(json.token as string);

      expect(session).not.toBeUndefined();
      expect(session?.token).toBe(json.token);
    });

    test("should reject unknown email", async () => {
      const { response, json } = await requestJson("/api/v1/users/login", {
        method: "POST",
        body: {
          email: "missing@example.com",
          password: "password123",
        },
      });

      expect(response.status).toBe(401);
      expect(json).toEqual({
        error: "email or password is wrong",
      });
    });

    test("should reject wrong password", async () => {
      await registerDefaultUser();

      const { response, json } = await requestJson("/api/v1/users/login", {
        method: "POST",
        body: {
          email: "test@example.com",
          password: "wrongpass123",
        },
      });

      expect(response.status).toBe(401);
      expect(json).toEqual({
        error: "email or password is wrong",
      });
    });

    test("should reject invalid email format", async () => {
      const { response, json } = await requestJson("/api/v1/users/login", {
        method: "POST",
        body: {
          email: "not-an-email",
          password: "password123",
        },
      });

      expect(response.status).toBe(422);
      expectValidationError(json);
    });

    test("should reject short password", async () => {
      const { response, json } = await requestJson("/api/v1/users/login", {
        method: "POST",
        body: {
          email: "test@example.com",
          password: "short",
        },
      });

      expect(response.status).toBe(422);
      expectValidationError(json);
    });
  });

  describe("GET /api/v1/users/current", () => {
    test("should return the current user for a valid token", async () => {
      const { json: loginJson } = await loginDefaultUser();

      const { response, json } = await requestJson("/api/v1/users/current", {
        headers: {
          authorization: `Bearer ${loginJson.token as string}`,
        },
      });

      expect(response.status).toBe(200);
      expect(json).toEqual({
        data: {
          id: expect.any(String),
          name: "Test User",
          email: "test@example.com",
          created_at: expect.any(String),
        },
      });
    });

    test("should reject missing authorization header", async () => {
      const { response, json } = await requestJson("/api/v1/users/current");

      expect(response.status).toBe(401);
      expectUnauthorized(json);
    });

    test("should reject malformed bearer token", async () => {
      const { response, json } = await requestJson("/api/v1/users/current", {
        headers: {
          authorization: "Bearer invalid-token",
        },
      });

      expect(response.status).toBe(401);
      expectUnauthorized(json);
    });

    test("should reject a valid-looking token that is not stored in sessions", async () => {
      const { json: loginJson } = await loginDefaultUser();

      await resetDatabase();
      await registerDefaultUser();

      const { response, json } = await requestJson("/api/v1/users/current", {
        headers: {
          authorization: `Bearer ${loginJson.token as string}`,
        },
      });

      expect(response.status).toBe(401);
      expectUnauthorized(json);
    });

    test("should reject a token after logout", async () => {
      const { json: loginJson } = await loginDefaultUser();

      await requestJson("/api/v1/users/logout", {
        method: "POST",
        headers: {
          authorization: `Bearer ${loginJson.token as string}`,
        },
      });

      const { response, json } = await requestJson("/api/v1/users/current", {
        headers: {
          authorization: `Bearer ${loginJson.token as string}`,
        },
      });

      expect(response.status).toBe(401);
      expectUnauthorized(json);
    });
  });

  describe("POST /api/v1/users/logout", () => {
    test("should logout with a valid token and delete its session", async () => {
      const { json: loginJson } = await loginDefaultUser();
      const token = loginJson.token as string;

      const { response, json } = await requestJson("/api/v1/users/logout", {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.status).toBe(200);
      expect(json).toEqual({
        data: "OK",
      });

      const session = await findSessionByToken(token);

      expect(session).toBeUndefined();
    });

    test("should reject missing authorization header", async () => {
      const { response, json } = await requestJson("/api/v1/users/logout", {
        method: "POST",
      });

      expect(response.status).toBe(401);
      expectUnauthorized(json);
    });

    test("should reject malformed bearer token", async () => {
      const { response, json } = await requestJson("/api/v1/users/logout", {
        method: "POST",
        headers: {
          authorization: "Bearer invalid-token",
        },
      });

      expect(response.status).toBe(401);
      expectUnauthorized(json);
    });

    test("should reject a token that is not stored in sessions", async () => {
      const { json: loginJson } = await loginDefaultUser();
      const token = loginJson.token as string;

      await resetDatabase();
      await registerDefaultUser();

      const { response, json } = await requestJson("/api/v1/users/logout", {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.status).toBe(401);
      expectUnauthorized(json);
    });

    test("should reject a token that was already logged out", async () => {
      const { json: loginJson } = await loginDefaultUser();
      const token = loginJson.token as string;

      await requestJson("/api/v1/users/logout", {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      const { response, json } = await requestJson("/api/v1/users/logout", {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.status).toBe(401);
      expectUnauthorized(json);
    });
  });
});

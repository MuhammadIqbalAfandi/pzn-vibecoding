import { createHmac, timingSafeEqual } from "node:crypto";

import { eq } from "drizzle-orm";

import { env } from "../config/env";
import { db } from "../db/client";
import { sessions, users } from "../db/schema";

type RegisterUserInput = {
  name: string;
  email: string;
  password: string;
};

type LoginUserInput = {
  email: string;
  password: string;
};

type AuthTokenPayload = {
  sub: string;
  email: string;
  name: string;
  exp: number;
};

export class UserConflictError extends Error {
  constructor(message = "email is already taken") {
    super(message);
    this.name = "UserConflictError";
  }
}

export class InvalidCredentialsError extends Error {
  constructor(message = "email or password is wrong") {
    super(message);
    this.name = "InvalidCredentialsError";
  }
}

export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

// Encodes plain text as base64url for token header and payload segments.
function toBase64Url(value: string): string {
  return Buffer.from(value).toString("base64url");
}

// Decodes a base64url token segment back into a UTF-8 string.
function fromBase64Url(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

// Creates the HMAC signature used to protect the token contents.
function createTokenSignature(encodedHeader: string, encodedPayload: string): string {
  return createHmac("sha256", env.authTokenSecret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest("base64url");
}

// Builds a signed auth token from the normalized payload data.
function signToken(payload: AuthTokenPayload): string {
  const header = {
    alg: "HS256",
    typ: "JWT",
  };

  const encodedHeader = toBase64Url(JSON.stringify(header));
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = createTokenSignature(encodedHeader, encodedPayload);

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

// Validates token structure, signature, and expiry before returning its payload.
function verifyToken(token: string): AuthTokenPayload {
  const parts = token.split(".");

  if (parts.length !== 3) {
    throw new UnauthorizedError();
  }

  const [encodedHeader, encodedPayload, receivedSignature] = parts;

  if (!encodedHeader || !encodedPayload || !receivedSignature) {
    throw new UnauthorizedError();
  }

  const expectedSignature = createTokenSignature(encodedHeader, encodedPayload);
  const receivedSignatureBuffer = Buffer.from(receivedSignature, "base64url");
  const expectedSignatureBuffer = Buffer.from(expectedSignature, "base64url");

  if (
    receivedSignatureBuffer.length !== expectedSignatureBuffer.length ||
    !timingSafeEqual(receivedSignatureBuffer, expectedSignatureBuffer)
  ) {
    throw new UnauthorizedError();
  }

  try {
    const header = JSON.parse(fromBase64Url(encodedHeader)) as {
      alg?: string;
      typ?: string;
    };
    const payload = JSON.parse(fromBase64Url(encodedPayload)) as Partial<AuthTokenPayload>;

    if (header.alg !== "HS256" || header.typ !== "JWT") {
      throw new UnauthorizedError();
    }

    if (
      typeof payload.sub !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.name !== "string" ||
      typeof payload.exp !== "number"
    ) {
      throw new UnauthorizedError();
    }

    if (payload.exp <= Math.floor(Date.now() / 1000)) {
      throw new UnauthorizedError();
    }

    return payload as AuthTokenPayload;
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw error;
    }

    throw new UnauthorizedError();
  }
}

// Persists a newly issued login token as an active session.
async function createSession(userId: string, token: string, expiresAt: Date) {
  await db.insert(sessions).values({
    userId,
    token,
    expiresAt,
  });
}

// Loads a session and ensures it still exists and has not expired.
async function getValidSession(token: string) {
  const session = await db.query.sessions.findFirst({
    where: eq(sessions.token, token),
  });

  if (!session) {
    throw new UnauthorizedError();
  }

  if (session.expiresAt.getTime() <= Date.now()) {
    throw new UnauthorizedError();
  }

  return session;
}

// Registers a new user after enforcing unique email and hashing the password.
export async function registerUser(input: RegisterUserInput) {
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();

  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, email),
    columns: {
      id: true,
    },
  });

  if (existingUser) {
    throw new UserConflictError();
  }

  const hashedPassword = await Bun.password.hash(input.password, {
    algorithm: "bcrypt",
    cost: 10,
  });

  await db.insert(users).values({
    name,
    email,
    password: hashedPassword,
  });

  return {
    data: "ok" as const,
  };
}

// Authenticates a user and creates a signed session token for later requests.
export async function loginUser(input: LoginUserInput) {
  const email = input.email.trim().toLowerCase();

  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user) {
    throw new InvalidCredentialsError();
  }

  const isPasswordValid = await Bun.password.verify(input.password, user.password);

  if (!isPasswordValid) {
    throw new InvalidCredentialsError();
  }

  const expiresAt = Math.floor(Date.now() / 1000) + 60 * 60 * 24;
  const token = signToken({
    sub: user.id,
    email: user.email,
    name: user.name,
    exp: expiresAt,
  });

  await createSession(user.id, token, new Date(expiresAt * 1000));

  return { token };
}

// Returns the current user profile when the supplied token is valid and active.
export async function getCurrentUser(token: string) {
  const payload = verifyToken(token);
  await getValidSession(token);

  const user = await db.query.users.findFirst({
    where: eq(users.id, payload.sub),
    columns: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new UnauthorizedError();
  }

  return {
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
      created_at: user.createdAt.toISOString(),
    },
  };
}

// Invalidates the supplied token by deleting its stored session record.
export async function logoutUser(token: string) {
  verifyToken(token);
  await getValidSession(token);

  await db.delete(sessions).where(eq(sessions.token, token));

  return {
    data: "OK" as const,
  };
}

import { createHmac } from "node:crypto";

import { eq } from "drizzle-orm";

import { env } from "../config/env";
import { db } from "../db/client";
import { users } from "../db/schema";

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

function toBase64Url(value: string): string {
  return Buffer.from(value).toString("base64url");
}

function signToken(payload: AuthTokenPayload): string {
  const header = {
    alg: "HS256",
    typ: "JWT",
  };

  const encodedHeader = toBase64Url(JSON.stringify(header));
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = createHmac("sha256", env.authTokenSecret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest("base64url");

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

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

  const token = signToken({
    sub: user.id,
    email: user.email,
    name: user.name,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
  });

  return { token };
}

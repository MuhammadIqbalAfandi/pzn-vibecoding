import { Elysia, t } from "elysia";

import {
  InvalidCredentialsError,
  UserConflictError,
  loginUser,
  registerUser,
} from "../service/user-service";

const registerBody = t.Object({
  name: t.String({ minLength: 1, maxLength: 255 }),
  email: t.String({ format: "email", maxLength: 255 }),
  password: t.String({ minLength: 8, maxLength: 255 }),
});

const loginBody = t.Object({
  email: t.String({ format: "email", maxLength: 255 }),
  password: t.String({ minLength: 8, maxLength: 255 }),
});

export const userRoutes = new Elysia({ prefix: "/api/v1/users" })
  .post(
    "/",
    async ({ body, set }) => {
      try {
        return await registerUser(body);
      } catch (error) {
        if (error instanceof UserConflictError) {
          set.status = 409;
          return { error: error.message };
        }

        throw error;
      }
    },
    {
      body: registerBody,
    },
  )
  .post(
    "/login",
    async ({ body, set }) => {
      try {
        return await loginUser(body);
      } catch (error) {
        if (error instanceof InvalidCredentialsError) {
          set.status = 401;
          return { error: error.message };
        }

        throw error;
      }
    },
    {
      body: loginBody,
    },
  );

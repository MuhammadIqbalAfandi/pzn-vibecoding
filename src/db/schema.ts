import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const appUsers = pgTable("app_users", {
  id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

import { defineConfig } from "drizzle-kit";
import "./scripts/load-env";

export default defineConfig({
  schema: "./src/db/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  // Keys stay camelCase in TypeScript, columns land as snake_case in Postgres.
  casing: "snake_case",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  strict: true,
  verbose: true,
});

import { defineConfig } from "drizzle-kit"

const isPostgres = process.env.DATABASE_CLIENT === "postgres"

export default defineConfig(
  isPostgres
    ? {
        dialect: "postgresql",
        schema: "./src/db/schema.postgres.ts",
        out: "./drizzle/postgres",
        dbCredentials: {
          url: process.env.DATABASE_URL ?? "postgres://tabora:tabora@localhost:5432/tabora",
        },
      }
    : {
        dialect: "sqlite",
        schema: "./src/db/schema.sqlite.ts",
        out: "./drizzle/sqlite",
        dbCredentials: { url: process.env.DATABASE_FILE ?? "./data/tabora.db" },
      },
)

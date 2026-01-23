// Prisma configuration for NPC Graph
import "dotenv/config";
import { defineConfig } from "prisma/config";
import path from "path";

export default defineConfig({
  earlyAccess: true,
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL || "file:./dev.db",
  },
});

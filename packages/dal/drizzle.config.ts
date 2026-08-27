import { defineConfig } from "drizzle-kit";

const databaseUrl =
  process.env.DATABASE_URL ?? "postgres://healthcare:healthcare@localhost:5433/healthcare";

export default defineConfig({
  // Points at compiled output, not src: drizzle-kit's config loader uses a
  // plain Node CJS require internally and doesn't remap NodeNext-style
  // ".js" specifiers back to sibling ".ts" files, so it can't load the
  // cross-referencing schema/*.ts source directly. `pnpm build` (see
  // package.json db:generate) runs before this every time.
  schema: "./dist/schema/index.js",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
});

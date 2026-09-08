import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

/**
 * The seed scripts are run by hand (`pnpm db:seed`, `pnpm db:seed:demo`)
 * rather than through the API's `--env-file` bootstrap, so DATABASE_URL is
 * usually not exported in the shell. Fall back to the same repo-root .env the
 * API reads instead of failing on a variable the developer reasonably
 * believes they already configured.
 */
export function resolveDatabaseUrl(): string {
  if (!process.env.DATABASE_URL) {
    const envFile = fileURLToPath(new URL("../../../.env", import.meta.url));
    if (existsSync(envFile)) {
      process.loadEnvFile(envFile);
    }
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to seed the database");
  }
  return databaseUrl;
}

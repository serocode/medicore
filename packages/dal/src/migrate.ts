import { migrate } from "drizzle-orm/postgres-js/migrator";
import { createDbClient } from "./client.js";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to run migrations");
}

const db = createDbClient(databaseUrl);

await migrate(db, { migrationsFolder: new URL("../drizzle", import.meta.url).pathname });

console.log("Migrations applied successfully.");
process.exit(0);

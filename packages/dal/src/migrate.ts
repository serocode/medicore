import { migrate } from "drizzle-orm/postgres-js/migrator";
import { createDbClient } from "./client.js";
import { resolveDatabaseUrl } from "./seed-env.js";

const db = createDbClient(resolveDatabaseUrl());

await migrate(db, { migrationsFolder: new URL("../drizzle", import.meta.url).pathname });

console.log("Migrations applied successfully.");
process.exit(0);

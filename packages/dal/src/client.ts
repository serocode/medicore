import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/index.js";

export function createDbClient(databaseUrl: string) {
  const queryClient = postgres(databaseUrl);
  return drizzle(queryClient, { schema });
}

export type Db = ReturnType<typeof createDbClient>;

export async function checkDbConnection(db: Db): Promise<void> {
  await db.execute(sql`select 1`);
}

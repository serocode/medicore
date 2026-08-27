import { createDbClient } from "@healthcare/dal";
import { env } from "./env.js";

export const db = createDbClient(env.DATABASE_URL);

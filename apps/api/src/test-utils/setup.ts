import { afterAll } from "vitest";
import { db } from "../db.js";

afterAll(async () => {
  await db.$client.end();
});

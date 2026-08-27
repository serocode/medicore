import type { LabTestCatalogItem, LabTestCatalogRepository } from "@healthcare/application";
import { eq } from "drizzle-orm";
import type { Db } from "../client.js";
import { labTestCatalogItem } from "../schema/laboratory.js";

function toCatalogItem(row: typeof labTestCatalogItem.$inferSelect): LabTestCatalogItem {
  return {
    id: row.id,
    category: row.category,
    name: row.name,
    isActive: row.isActive,
  };
}

export class DrizzleLabTestCatalogRepository implements LabTestCatalogRepository {
  constructor(private db: Db) {}

  async list(activeOnly?: boolean): Promise<LabTestCatalogItem[]> {
    const rows = activeOnly
      ? await this.db.select().from(labTestCatalogItem).where(eq(labTestCatalogItem.isActive, true))
      : await this.db.select().from(labTestCatalogItem);
    return rows.map(toCatalogItem);
  }

  async findById(id: string): Promise<LabTestCatalogItem | null> {
    const [row] = await this.db
      .select()
      .from(labTestCatalogItem)
      .where(eq(labTestCatalogItem.id, id));
    return row ? toCatalogItem(row) : null;
  }
}

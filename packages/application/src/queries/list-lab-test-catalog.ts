import type { LabTestCatalogItem, LabTestCatalogRepository } from "../ports.js";

export async function listLabTestCatalog(deps: {
  catalog: LabTestCatalogRepository;
}): Promise<LabTestCatalogItem[]> {
  return deps.catalog.list(true);
}

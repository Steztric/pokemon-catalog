import type { IStorageAdapter } from "../../domain/interfaces";
import type { CatalogEntry, CatalogFilter } from "../../domain/entities";

export async function searchCatalog(
  _storage: IStorageAdapter,
  _filter?: CatalogFilter
): Promise<CatalogEntry[]> {
  return [];
}

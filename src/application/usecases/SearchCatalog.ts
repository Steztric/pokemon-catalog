import type { IStorageAdapter } from "../../domain/interfaces";
import type { CatalogFilter } from "../../domain/entities";
import type { CardDetail } from "./GetCardDetail";

const SORT_KEY: Record<
  NonNullable<CatalogFilter["sortBy"]>,
  (d: CardDetail) => string | number
> = {
  name: (d) => d.card.name,
  set: (d) => d.card.setName,
  number: (d) => d.card.number,
  rarity: (d) => d.card.rarity,
  firstAddedAt: (d) => d.entry.firstAddedAt.getTime(),
};

export async function searchCatalog(
  storage: IStorageAdapter,
  filter?: CatalogFilter,
): Promise<CardDetail[]> {
  const entries = await storage.catalogRepository.findAll(filter);

  const details: CardDetail[] = [];
  for (const entry of entries) {
    const card = await storage.cardRepository.findById(entry.cardId);
    if (card) details.push({ entry, card });
  }

  // Apply card-metadata filters in memory (IndexedDB repos don't filter via JOIN)
  const filtered = details.filter((d) => {
    if (
      filter?.name &&
      !d.card.name.toLowerCase().includes(filter.name.toLowerCase())
    )
      return false;
    if (filter?.setId && d.card.setId !== filter.setId) return false;
    if (filter?.rarity && d.card.rarity !== filter.rarity) return false;
    if (filter?.type && d.card.type !== filter.type) return false;
    return true;
  });

  if (!filter?.sortBy) return filtered;

  const key = SORT_KEY[filter.sortBy];
  const dir = filter.sortDir === "desc" ? -1 : 1;
  return [...filtered].sort((a, b) => {
    const av = key(a);
    const bv = key(b);
    if (typeof av === "number" && typeof bv === "number")
      return (av - bv) * dir;
    return String(av).localeCompare(String(bv), undefined, { numeric: true }) * dir;
  });
}

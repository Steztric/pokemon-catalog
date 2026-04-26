import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import type { CatalogFilter } from "../../domain/entities";
import { useCatalog } from "../hooks/useCatalog";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { FilterBar } from "../components/FilterBar";
import { ViewToggle, type ViewMode } from "../components/ViewToggle";
import { CardGrid } from "../components/CardGrid";
import { CardList } from "../components/CardList";
import { CatalogSkeleton } from "../components/CatalogSkeleton";

function filterFromParams(params: URLSearchParams): CatalogFilter {
  return {
    name: params.get("name") || undefined,
    setId: params.get("setId") || undefined,
    rarity: params.get("rarity") || undefined,
    type: (params.get("type") as CatalogFilter["type"]) || undefined,
    sortBy: (params.get("sortBy") as CatalogFilter["sortBy"]) || undefined,
    sortDir: (params.get("sortDir") as CatalogFilter["sortDir"]) || undefined,
  };
}

function filterToParams(filter: CatalogFilter): URLSearchParams {
  const p = new URLSearchParams();
  if (filter.name) p.set("name", filter.name);
  if (filter.setId) p.set("setId", filter.setId);
  if (filter.rarity) p.set("rarity", filter.rarity);
  if (filter.type) p.set("type", filter.type);
  if (filter.sortBy) p.set("sortBy", filter.sortBy);
  if (filter.sortDir) p.set("sortDir", filter.sortDir);
  return p;
}

export function DashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useLocalStorage<ViewMode>("catalog-view", "grid");

  const filter = filterFromParams(searchParams);
  const { data: items, isLoading, isError } = useCatalog(filter);

  const availableSets = useMemo(() => {
    if (!items) return [];
    const seen = new Map<string, string>();
    for (const { card } of items) seen.set(card.setId, card.setName);
    return Array.from(seen.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [items]);

  const availableRarities = useMemo(() => {
    if (!items) return [];
    const seen = new Set<string>();
    for (const { card } of items) seen.add(card.rarity);
    return Array.from(seen).sort();
  }, [items]);

  function handleFilterChange(next: CatalogFilter) {
    setSearchParams(filterToParams(next), { replace: true });
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex items-center gap-3">
          <ViewToggle value={viewMode} onChange={setViewMode} />
          <Link
            to="/scanner"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Go to Scanner
          </Link>
        </div>
      </div>

      <FilterBar
        filter={filter}
        availableSets={availableSets}
        availableRarities={availableRarities}
        onChange={handleFilterChange}
      />

      {isLoading && <CatalogSkeleton />}

      {isError && (
        <p className="text-red-600 text-sm">Failed to load your collection. Please try again.</p>
      )}

      {!isLoading && !isError && items && items.length === 0 && (
        <p className="text-gray-500 text-sm">
          No cards found. Start scanning to build your collection!
        </p>
      )}

      {!isLoading && !isError && items && items.length > 0 && (
        viewMode === "grid"
          ? <CardGrid items={items} />
          : <CardList items={items} />
      )}
    </div>
  );
}

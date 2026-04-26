import type { CatalogFilter, CardType } from "../../domain/entities";

interface SetOption {
  id: string;
  name: string;
}

interface Props {
  filter: CatalogFilter;
  availableSets: SetOption[];
  availableRarities: string[];
  onChange: (filter: CatalogFilter) => void;
}

const CARD_TYPES: CardType[] = ["Pokemon", "Trainer", "Energy"];

const SORT_OPTIONS: { value: NonNullable<CatalogFilter["sortBy"]>; label: string }[] = [
  { value: "name", label: "Name" },
  { value: "set", label: "Set" },
  { value: "number", label: "Number" },
  { value: "rarity", label: "Rarity" },
  { value: "firstAddedAt", label: "Date added" },
];

export function FilterBar({ filter, availableSets, availableRarities, onChange }: Props) {
  function set<K extends keyof CatalogFilter>(key: K, value: CatalogFilter[K]) {
    onChange({ ...filter, [key]: value || undefined });
  }

  function toggleSortDir() {
    set("sortDir", filter.sortDir === "desc" ? "asc" : "desc");
  }

  const hasFilters =
    filter.name || filter.setId || filter.rarity || filter.type;

  return (
    <div className="mb-6 space-y-3">
      <div className="flex flex-wrap gap-3">
        <input
          type="search"
          placeholder="Search by name…"
          value={filter.name ?? ""}
          onChange={(e) => set("name", e.target.value)}
          className="border border-gray-300 rounded px-3 py-1.5 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Search by name"
        />

        <select
          value={filter.setId ?? ""}
          onChange={(e) => set("setId", e.target.value)}
          className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Filter by set"
        >
          <option value="">All sets</option>
          {availableSets.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        <select
          value={filter.rarity ?? ""}
          onChange={(e) => set("rarity", e.target.value)}
          className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Filter by rarity"
        >
          <option value="">All rarities</option>
          {availableRarities.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        <select
          value={filter.type ?? ""}
          onChange={(e) => set("type", e.target.value as CardType)}
          className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Filter by type"
        >
          <option value="">All types</option>
          {CARD_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        {hasFilters && (
          <button
            onClick={() =>
              onChange({
                sortBy: filter.sortBy,
                sortDir: filter.sortDir,
              })
            }
            className="text-sm text-blue-600 hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">Sort by:</span>
        <div className="flex flex-wrap gap-1">
          {SORT_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => set("sortBy", value)}
              className={`px-3 py-1 rounded text-sm ${
                filter.sortBy === value
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {filter.sortBy && (
          <button
            onClick={toggleSortDir}
            aria-label="Toggle sort direction"
            className="px-2 py-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm"
          >
            {filter.sortDir === "desc" ? "↓" : "↑"}
          </button>
        )}
      </div>
    </div>
  );
}

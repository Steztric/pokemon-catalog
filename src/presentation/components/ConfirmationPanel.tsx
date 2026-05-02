import { useState, useRef, useEffect } from "react";
import type { PokemonCard, CatalogEntry, IdentificationResult } from "../../domain/entities";

export interface ConfirmationData {
  result: IdentificationResult;
  card: PokemonCard | null;
  existingEntry: CatalogEntry | null;
}

interface ConfirmationPanelProps {
  data: ConfirmationData;
  onConfirm: (cardId: string) => Promise<void>;
  onReject: () => void;
  searchCards: (query: string) => Promise<PokemonCard[]>;
}

export function ConfirmationPanel({ data, onConfirm, onReject, searchCards }: ConfirmationPanelProps) {
  const [mode, setMode] = useState<"review" | "search">("review");
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PokemonCard[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, []);

  function handleQueryChange(q: string) {
    setQuery(q);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (!q.trim()) { setSearchResults([]); return; }
    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchCards(q);
        setSearchResults(results);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  }

  async function handleConfirm(cardId: string) {
    setIsAdding(true);
    await onConfirm(cardId);
  }

  const { card, existingEntry, result } = data;
  const isLowConf = result.status === "low_confidence";
  const isDuplicate = existingEntry !== null;
  const hasCard = card !== null && result.cardId != null;

  if (mode === "search") {
    return (
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Search for card</h2>
        <p className="text-sm text-gray-500 mb-4">
          Type a card name to find the correct match.
        </p>
        <input
          type="text"
          value={query}
          onChange={e => handleQueryChange(e.target.value)}
          placeholder="e.g. Charizard, Pikachu…"
          autoFocus
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
        />
        {isSearching && (
          <p className="text-sm text-gray-400 mb-2">Searching…</p>
        )}
        {searchResults.length > 0 && (
          <ul
            aria-label="Search results"
            className="divide-y divide-gray-100 rounded-lg border border-gray-200 max-h-56 overflow-y-auto mb-4"
          >
            {searchResults.map(c => (
              <li key={c.id}>
                <button
                  onClick={() => handleConfirm(c.id)}
                  disabled={isAdding}
                  className="w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center gap-3 disabled:opacity-50"
                >
                  <img src={c.imageUrl} alt={c.name} className="h-12 w-9 object-cover rounded" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{c.name}</p>
                    <p className="text-xs text-gray-500">{c.setName} · #{c.number}</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
        {!isSearching && query.trim() && searchResults.length === 0 && (
          <p className="text-sm text-gray-400 mb-4">No cards found for "{query}".</p>
        )}
        <button
          onClick={onReject}
          className="w-full py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Cancel — skip this card
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg">
      <div className="flex items-start gap-4 mb-5">
        {card ? (
          <img
            src={card.imageUrl}
            alt={card.name}
            className="h-36 w-auto rounded-lg shadow"
          />
        ) : (
          <div className="h-36 w-24 rounded-lg bg-gray-100 flex items-center justify-center text-xs text-gray-400 shrink-0">
            No image
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap gap-1 mb-2">
            {isLowConf && (
              <span className="rounded bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
                Low confidence
              </span>
            )}
            {isDuplicate && (
              <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                Already in collection ×{existingEntry!.quantity}
              </span>
            )}
          </div>
          {card ? (
            <>
              <h2 className="text-xl font-bold text-gray-900 leading-tight">{card.name}</h2>
              <p className="text-sm text-gray-600 mt-0.5">{card.setName} · #{card.number}</p>
              <p className="text-sm text-gray-400">{card.rarity}</p>
            </>
          ) : (
            <h2 className="text-xl font-bold text-gray-400">Unknown card</h2>
          )}
          <p className="mt-3 text-xs text-gray-400">
            {(result.confidence * 100).toFixed(0)}% confidence · {result.strategy}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <button
          onClick={() => hasCard && handleConfirm(result.cardId!)}
          disabled={!hasCard || isAdding}
          className="w-full bg-green-600 text-white py-2.5 rounded-lg font-medium hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {isAdding ? "Adding…" : "Confirm — add to collection"}
        </button>
        <div className="flex gap-2">
          <button
            onClick={onReject}
            disabled={isAdding}
            className="flex-1 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40"
          >
            Reject
          </button>
          <button
            onClick={() => setMode("search")}
            disabled={isAdding}
            className="flex-1 py-2 text-sm text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 disabled:opacity-40"
          >
            Search manually
          </button>
        </div>
      </div>
    </div>
  );
}

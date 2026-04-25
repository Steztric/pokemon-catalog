import { Link } from "react-router-dom";
import type { PokemonCard } from "../../domain/entities";

// TODO: Replace with real catalog data once Phase 4 (Local Persistence Layer) and
// Phase 5 (Collection Dashboard) are complete. At that point this component should
// query ICatalogRepository via the SearchCatalog use case and remove PLACEHOLDER_CARDS.
const PLACEHOLDER_CARDS: PokemonCard[] = [
  {
    id: "base1-4",
    name: "Charizard",
    setId: "base1",
    setName: "Base Set",
    number: "4",
    rarity: "Rare Holo",
    type: "Pokemon",
    imageUrl: "https://images.pokemontcg.io/base1/4_hires.png",
  },
  {
    id: "base1-58",
    name: "Pikachu",
    setId: "base1",
    setName: "Base Set",
    number: "58",
    rarity: "Common",
    type: "Pokemon",
    imageUrl: "https://images.pokemontcg.io/base1/58_hires.png",
  },
  {
    id: "base1-88",
    name: "Professor Oak",
    setId: "base1",
    setName: "Base Set",
    number: "88",
    rarity: "Uncommon",
    type: "Trainer",
    imageUrl: "https://images.pokemontcg.io/base1/88_hires.png",
  },
];

export function DashboardPage() {
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <Link
          to="/scanner"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
        >
          Go to Scanner
        </Link>
      </div>

      <div className="mb-4 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
        Showing placeholder cards — your scanned collection will appear here once scanning and persistence are set up.
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {PLACEHOLDER_CARDS.map((card) => (
          <div key={card.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <img
              src={card.imageUrl}
              alt={card.name}
              className="w-full object-contain bg-gray-50"
              loading="lazy"
            />
            <div className="p-3">
              <p className="font-semibold text-gray-900 text-sm truncate">{card.name}</p>
              <p className="text-xs text-gray-500 truncate">{card.setName}</p>
              <p className="text-xs text-gray-400 mt-1">{card.rarity}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

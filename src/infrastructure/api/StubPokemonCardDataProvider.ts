import type { IPokemonCardDataProvider } from "../../domain/interfaces";
import type { PokemonCard, CardSet } from "../../domain/entities";

const STUB_CARDS: PokemonCard[] = [
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
    id: "base1-25",
    name: "Pikachu",
    setId: "base1",
    setName: "Base Set",
    number: "25",
    rarity: "Common",
    type: "Pokemon",
    imageUrl: "https://images.pokemontcg.io/base1/25_hires.png",
  },
  {
    id: "base1-58",
    name: "Professor Oak",
    setId: "base1",
    setName: "Base Set",
    number: "58",
    rarity: "Uncommon",
    type: "Trainer",
    imageUrl: "https://images.pokemontcg.io/base1/58_hires.png",
  },
];

const STUB_SETS: CardSet[] = [
  {
    id: "base1",
    name: "Base Set",
    series: "Base",
    releaseDate: "1998/12/18",
    total: 102,
  },
];

export class StubPokemonCardDataProvider implements IPokemonCardDataProvider {
  async getCard(id: string): Promise<PokemonCard> {
    const card = STUB_CARDS.find((c) => c.id === id);
    if (!card) throw new Error(`Card not found: ${id}`);
    return card;
  }

  async getSet(id: string): Promise<CardSet> {
    const set = STUB_SETS.find((s) => s.id === id);
    if (!set) throw new Error(`Set not found: ${id}`);
    return set;
  }

  async searchCards(query: string): Promise<PokemonCard[]> {
    return STUB_CARDS.filter((c) =>
      c.name.toLowerCase().includes(query.toLowerCase())
    );
  }

  async getAllSets(): Promise<CardSet[]> {
    return [...STUB_SETS];
  }
}

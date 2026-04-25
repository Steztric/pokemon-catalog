import type { IPokemonCardDataProvider } from "../../domain/interfaces";
import type { PokemonCard, CardSet, CardType } from "../../domain/entities";

const BASE_URL = "https://api.pokemontcg.io/v2";

// Internal shapes returned by the pokemontcg.io v2 API
interface ApiCard {
  id: string;
  name: string;
  number: string;
  rarity?: string;
  supertype: string;
  set: ApiSet;
  images: { small: string; large: string };
}

interface ApiSet {
  id: string;
  name: string;
  series: string;
  releaseDate: string;
  total: number;
}

interface SingleCardResponse {
  data: ApiCard;
}

interface CardListResponse {
  data: ApiCard[];
}

interface SingleSetResponse {
  data: ApiSet;
}

interface SetListResponse {
  data: ApiSet[];
}

function supertypeToCardType(supertype: string): CardType {
  if (supertype === "Pokémon") return "Pokemon";
  if (supertype === "Energy") return "Energy";
  return "Trainer";
}

function mapCard(raw: ApiCard): PokemonCard {
  return {
    id: raw.id,
    name: raw.name,
    setId: raw.set.id,
    setName: raw.set.name,
    number: raw.number,
    rarity: raw.rarity ?? "Unknown",
    type: supertypeToCardType(raw.supertype),
    imageUrl: raw.images.large,
  };
}

function mapSet(raw: ApiSet): CardSet {
  return {
    id: raw.id,
    name: raw.name,
    series: raw.series,
    releaseDate: raw.releaseDate,
    total: raw.total,
  };
}

export class PokemonTCGApiClient implements IPokemonCardDataProvider {
  private readonly headers: HeadersInit;

  // apiKey defaults to the Vite env var; injectable for tests
  constructor(apiKey?: string) {
    const key = apiKey ?? (typeof import.meta !== "undefined" ? import.meta.env?.VITE_POKEMON_TCG_API_KEY : undefined);
    this.headers = key ? { "X-Api-Key": key } : {};
  }

  private async get<T>(path: string): Promise<T> {
    const response = await fetch(`${BASE_URL}${path}`, { headers: this.headers });
    if (!response.ok) {
      throw new Error(`Pokemon TCG API error ${response.status}: ${path}`);
    }
    return response.json() as Promise<T>;
  }

  async getCard(id: string): Promise<PokemonCard> {
    const body = await this.get<SingleCardResponse>(`/cards/${encodeURIComponent(id)}`);
    return mapCard(body.data);
  }

  async getSet(id: string): Promise<CardSet> {
    const body = await this.get<SingleSetResponse>(`/sets/${encodeURIComponent(id)}`);
    return mapSet(body.data);
  }

  async searchCards(query: string): Promise<PokemonCard[]> {
    const encoded = encodeURIComponent(`name:*${query}*`);
    const body = await this.get<CardListResponse>(`/cards?q=${encoded}&pageSize=250`);
    return body.data.map(mapCard);
  }

  async getAllSets(): Promise<CardSet[]> {
    const body = await this.get<SetListResponse>("/sets?pageSize=250");
    return body.data.map(mapSet);
  }
}

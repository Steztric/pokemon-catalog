export type CardType = "Pokemon" | "Trainer" | "Energy";

export interface PokemonCard {
  id: string;
  name: string;
  setId: string;
  setName: string;
  number: string;
  rarity: string;
  type: CardType;
  imageUrl: string;
}

export interface CardSet {
  id: string;
  name: string;
  series: string;
  releaseDate: string;
  total: number;
}

export interface CatalogEntry {
  id: string;
  cardId: string;
  quantity: number;
  firstAddedAt: Date;
}

export interface ScanEvent {
  id: string;
  cardId: string;
  scannedAt: Date;
  sessionId: string;
  confirmed: boolean;
}

export interface ScanSession {
  id: string;
  startedAt: Date;
  endedAt: Date | null;
  cardsScanned: number;
}

export interface CardFilter {
  name?: string;
  setId?: string;
  rarity?: string;
  type?: CardType;
}

export interface CatalogFilter {
  name?: string;
  setId?: string;
  rarity?: string;
  type?: CardType;
  sortBy?: "name" | "set" | "number" | "rarity" | "firstAddedAt";
  sortDir?: "asc" | "desc";
}

export interface ImageFrame {
  data: Uint8ClampedArray;
  width: number;
  height: number;
  capturedAt: Date;
}

export interface IdentificationResult {
  status: "identified" | "low_confidence" | "not_a_card";
  cardId?: string;
  confidence: number;
  strategy: "local_hash" | "llm_vision";
}

import type { PokemonCard, CardSet, ImageFrame, IdentificationResult } from "../entities";

export interface ICardIdentificationService {
  identify(frame: ImageFrame): Promise<IdentificationResult>;
}

export interface IPokemonCardDataProvider {
  getCard(id: string): Promise<PokemonCard>;
  getSet(id: string): Promise<CardSet>;
  searchCards(query: string): Promise<PokemonCard[]>;
  getAllSets(): Promise<CardSet[]>;
}

import type { IStorageAdapter } from "../../domain/interfaces";
import type { CatalogEntry, PokemonCard } from "../../domain/entities";

export interface CardDetail {
  entry: CatalogEntry;
  card: PokemonCard;
}

export async function getCardDetail(
  _storage: IStorageAdapter,
  _cardId: string
): Promise<CardDetail | null> {
  return null;
}

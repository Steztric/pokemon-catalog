import type { IStorageAdapter } from "../../domain/interfaces";
import type { CatalogEntry, PokemonCard } from "../../domain/entities";

export interface CardDetail {
  entry: CatalogEntry;
  card: PokemonCard;
}

export async function getCardDetail(
  storage: IStorageAdapter,
  cardId: string,
): Promise<CardDetail | null> {
  const entry = await storage.catalogRepository.findByCardId(cardId);
  if (!entry) return null;
  const card = await storage.cardRepository.findById(cardId);
  if (!card) return null;
  return { entry, card };
}

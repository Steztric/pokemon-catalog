import type { IStorageAdapter, IPokemonCardDataProvider } from "../../domain/interfaces";
import type { CatalogEntry } from "../../domain/entities";

export interface AddCardToCatalogInput {
  cardId: string;
  sessionId: string;
}

export interface AddCardToCatalogOutput {
  catalogEntryId: string;
}

export async function addCardToCatalog(
  storage: IStorageAdapter,
  cardDataProvider: IPokemonCardDataProvider,
  input: AddCardToCatalogInput,
): Promise<AddCardToCatalogOutput> {
  // Ensure card metadata is cached locally
  let card = await storage.cardRepository.findById(input.cardId);
  if (!card) {
    card = await cardDataProvider.getCard(input.cardId);
    await storage.cardRepository.upsert(card);
  }

  // Upsert catalog entry: create at qty 1 or increment
  const existing = await storage.catalogRepository.findByCardId(input.cardId);
  let entryId: string;
  if (existing) {
    await storage.catalogRepository.incrementQuantity(input.cardId);
    entryId = existing.id;
  } else {
    entryId = crypto.randomUUID();
    const entry: CatalogEntry = {
      id: entryId,
      cardId: input.cardId,
      quantity: 1,
      firstAddedAt: new Date(),
    };
    await storage.catalogRepository.save(entry);
  }

  // Record the confirmed scan event
  await storage.scanEventRepository.save({
    id: crypto.randomUUID(),
    cardId: input.cardId,
    scannedAt: new Date(),
    sessionId: input.sessionId,
    confirmed: true,
  });

  // Increment session scan count in the database
  const session = await storage.scanSessionRepository.findById(input.sessionId);
  if (session) {
    await storage.scanSessionRepository.update({
      ...session,
      cardsScanned: session.cardsScanned + 1,
    });
  }

  return { catalogEntryId: entryId };
}

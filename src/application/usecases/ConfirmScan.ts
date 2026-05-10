import type { IStorageAdapter, IPokemonCardDataProvider, IImageCacheAdapter } from "../../domain/interfaces";
import { addCardToCatalog } from "./AddCardToCatalog";

export interface ConfirmScanInput {
  cardId: string;
  sessionId: string;
}

export async function confirmScan(
  storage: IStorageAdapter,
  cardDataProvider: IPokemonCardDataProvider,
  imageCache: IImageCacheAdapter,
  input: ConfirmScanInput,
): Promise<void> {
  await addCardToCatalog(storage, cardDataProvider, imageCache, input);
}

import type { IStorageAdapter, IPokemonCardDataProvider } from "../../domain/interfaces";
import { addCardToCatalog } from "./AddCardToCatalog";

export interface ConfirmScanInput {
  cardId: string;
  sessionId: string;
}

export async function confirmScan(
  storage: IStorageAdapter,
  cardDataProvider: IPokemonCardDataProvider,
  input: ConfirmScanInput,
): Promise<void> {
  await addCardToCatalog(storage, cardDataProvider, input);
}

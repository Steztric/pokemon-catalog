import type { IStorageAdapter } from "../../domain/interfaces";

export interface AddCardToCatalogInput {
  cardId: string;
  sessionId: string;
}

export interface AddCardToCatalogOutput {
  catalogEntryId: string;
}

export async function addCardToCatalog(
  _storage: IStorageAdapter,
  _input: AddCardToCatalogInput
): Promise<AddCardToCatalogOutput> {
  return { catalogEntryId: "" };
}

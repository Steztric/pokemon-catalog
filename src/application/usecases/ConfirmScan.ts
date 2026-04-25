import type { IStorageAdapter } from "../../domain/interfaces";

export interface ConfirmScanInput {
  scanEventId: string;
  cardId: string;
  sessionId: string;
}

export async function confirmScan(
  _storage: IStorageAdapter,
  _input: ConfirmScanInput
): Promise<void> {}

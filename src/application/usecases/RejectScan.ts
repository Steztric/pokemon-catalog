import type { IStorageAdapter } from "../../domain/interfaces";

export interface RejectScanInput {
  scanEventId: string;
  sessionId: string;
}

export async function rejectScan(
  _storage: IStorageAdapter,
  _input: RejectScanInput
): Promise<void> {}

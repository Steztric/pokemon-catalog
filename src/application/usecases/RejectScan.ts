import type { IStorageAdapter } from "../../domain/interfaces";

export interface RejectScanInput {
  scanEventId?: string;
  sessionId: string;
}

// Rejection has no side effects — the scanner resumes active detection.
export async function rejectScan(
  _storage: IStorageAdapter,
  _input: RejectScanInput,
): Promise<void> {}

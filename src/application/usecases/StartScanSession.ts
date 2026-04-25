import type { IStorageAdapter } from "../../domain/interfaces";

export interface StartScanSessionOutput {
  sessionId: string;
}

export async function startScanSession(
  _storage: IStorageAdapter
): Promise<StartScanSessionOutput> {
  return { sessionId: "" };
}

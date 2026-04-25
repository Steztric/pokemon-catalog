import type { IStorageAdapter } from "../../domain/interfaces";

export interface EndScanSessionInput {
  sessionId: string;
}

export async function endScanSession(
  _storage: IStorageAdapter,
  _input: EndScanSessionInput
): Promise<void> {}

import type { IStorageAdapter } from "../../domain/interfaces";
import type { ScanSession } from "../../domain/entities";

export interface StartScanSessionOutput {
  sessionId: string;
}

export async function startScanSession(
  storage: IStorageAdapter,
): Promise<StartScanSessionOutput> {
  const session: ScanSession = {
    id: crypto.randomUUID(),
    startedAt: new Date(),
    endedAt: null,
    cardsScanned: 0,
  };
  await storage.scanSessionRepository.save(session);
  return { sessionId: session.id };
}

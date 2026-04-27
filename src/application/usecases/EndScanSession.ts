import type { IStorageAdapter } from "../../domain/interfaces";

export interface EndScanSessionInput {
  sessionId: string;
  cardsScanned?: number;
}

export async function endScanSession(
  storage: IStorageAdapter,
  input: EndScanSessionInput,
): Promise<void> {
  const session = await storage.scanSessionRepository.findById(input.sessionId);
  if (!session) return;
  await storage.scanSessionRepository.update({
    ...session,
    endedAt: new Date(),
    cardsScanned: input.cardsScanned ?? session.cardsScanned,
  });
}

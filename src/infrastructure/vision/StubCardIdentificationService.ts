import type { ICardIdentificationService } from "../../domain/interfaces";
import type { ImageFrame, IdentificationResult } from "../../domain/entities";

export class StubCardIdentificationService implements ICardIdentificationService {
  async identify(_frame: ImageFrame): Promise<IdentificationResult> {
    return { status: "not_a_card", confidence: 0, strategy: "local_hash" };
  }
}

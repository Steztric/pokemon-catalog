import type { ICardIdentificationService } from "../../domain/interfaces";
import type { ImageFrame, IdentificationResult } from "../../domain/entities";
import type { IPHashIndexRepository } from "../../domain/interfaces";
import { computePHash, hammingDistance, hexToPHash } from "./pHash";

const HASH_BITS = 64;
const HIGH_CONFIDENCE_MAX_DISTANCE = 10;

export class LocalPHashIdentifier implements ICardIdentificationService {
  constructor(private readonly repo: IPHashIndexRepository) {}

  async identify(frame: ImageFrame): Promise<IdentificationResult> {
    const queryHash = computePHash(frame);
    const entries = await this.repo.findAll();

    console.log(`[pHash] index size=${entries.length}`);

    if (entries.length === 0) {
      console.log("[pHash] → low_confidence (empty index)");
      return { status: "low_confidence", confidence: 0, strategy: "local_hash" };
    }

    let bestDistance = Infinity;
    let bestCardId: string | undefined;

    for (const entry of entries) {
      const dist = hammingDistance(queryHash, hexToPHash(entry.hashHex));
      if (dist < bestDistance) {
        bestDistance = dist;
        bestCardId = entry.cardId;
      }
    }

    const confidence = 1 - bestDistance / HASH_BITS;
    console.log(`[pHash] bestDist=${bestDistance} bestCardId=${bestCardId} conf=${confidence.toFixed(3)}`);

    if (bestDistance <= HIGH_CONFIDENCE_MAX_DISTANCE) {
      console.log(`[pHash] → identified (${bestCardId})`);
      return { status: "identified", cardId: bestCardId, confidence, strategy: "local_hash" };
    }
    console.log("[pHash] → low_confidence (distance too high)");
    return { status: "low_confidence", cardId: bestCardId, confidence, strategy: "local_hash" };
  }
}
